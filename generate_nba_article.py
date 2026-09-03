#!/usr/bin/env python3
"""NBA TACTICS LAB article build, validation, media upload, and microCMS CLI.

The CLI is intentionally safe by default:
- validation and build never access the network;
- publish performs no mutation unless --execute is supplied;
- creating and updating require separate explicit flags;
- public publication requires an additional slug confirmation.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
DEFAULT_SPEC = ROOT / "content-drafts" / "spain-pnr-drop-defense-phoenix-suns.metadata.json"
DEFAULT_ENDPOINT = "articles"
ALLOWED_CONTENT_TYPES = {"TACTICS", "NEWS", "COLUMN", "TEAM", "HIGHLIGHT"}
VOID_TAGS = {"br", "hr", "img", "input", "meta", "link", "source"}
ALLOWED_TAGS = {
    "a", "blockquote", "br", "caption", "code", "em", "figcaption", "figure",
    "h2", "h3", "h4", "iframe", "img", "li", "ol", "p", "pre", "strong",
    "table", "tbody", "td", "th", "thead", "tr", "ul",
}
PLACEHOLDER_PATTERNS = (
    r"\{\{[^}]+\}\}",
    r"YOUR_[A-Z0-9_]+",
    r"【\s*Video Title\s*】",
    r"__TACTICS_BOARD_URL__",
)
BANNED_TERMS = {
    "PnR": "P&R",
    "ピックアンドロール": "ピック＆ロール",
    "ボールマン": "ハンドラー",
    "壁役": "スクリーナー",
    "バックピック": "バックスクリーン",
}


class ToolError(RuntimeError):
    pass


def youtube_video_id(url: str) -> str | None:
    """Return a validated YouTube video ID for watch, short, live, or embed URLs."""
    parsed = urllib.parse.urlparse(url)
    hostname = (parsed.hostname or "").lower()
    if hostname.startswith("www."):
        hostname = hostname[4:]

    video_id: str | None = None
    path_parts = [part for part in parsed.path.split("/") if part]
    if hostname == "youtu.be" and path_parts:
        video_id = path_parts[0]
    elif hostname in {"youtube.com", "m.youtube.com"}:
        if parsed.path == "/watch":
            video_id = urllib.parse.parse_qs(parsed.query).get("v", [None])[0]
        elif len(path_parts) >= 2 and path_parts[0] in {"embed", "shorts", "live"}:
            video_id = path_parts[1]

    return video_id if video_id and re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id) else None


@dataclass
class Report:
    errors: list[str]
    warnings: list[str]
    metrics: dict[str, Any]

    @property
    def ok(self) -> bool:
        return not self.errors

    def as_dict(self) -> dict[str, Any]:
        return {"ok": self.ok, "errors": self.errors, "warnings": self.warnings, "metrics": self.metrics}


class ArticleHTMLInspector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.stack: list[str] = []
        self.errors: list[str] = []
        self.h2: list[str] = []
        self._h2_buffer: list[str] | None = None
        self.text: list[str] = []
        self.images: list[str] = []
        self.iframes: list[str] = []
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        attr_map = {key.lower(): value or "" for key, value in attrs}
        if tag not in ALLOWED_TAGS:
            self.errors.append(f"許可されていないHTMLタグです: <{tag}>")
        for key in attr_map:
            if key.startswith("on"):
                self.errors.append(f"イベント属性は禁止です: {key}")
        if tag == "script" or tag == "style":
            self.errors.append(f"記事本文内の<{tag}>は禁止です")
        if tag == "h2":
            self._h2_buffer = []
        if tag == "img":
            src = attr_map.get("src", "")
            alt = attr_map.get("alt", "")
            self.images.append(src)
            if not src.startswith("https://"):
                self.errors.append("画像URLはHTTPSの絶対URLで指定してください")
            if not alt.strip():
                self.errors.append("すべての画像にaltテキストが必要です")
        if tag == "iframe":
            src = attr_map.get("src", "")
            self.iframes.append(src)
            parsed = urllib.parse.urlparse(src)
            if parsed.scheme != "https" or parsed.hostname not in {"www.youtube.com", "www.youtube-nocookie.com"}:
                self.errors.append("iframeはYouTubeのHTTPS埋め込みURLだけを許可します")
            if "/embed/" not in parsed.path:
                self.errors.append("YouTube URLは /embed/{video_id} 形式にしてください")
            if "title" not in attr_map or "allowfullscreen" not in attr_map:
                self.errors.append("iframeにはtitleとallowfullscreenが必要です")
        if tag == "a":
            href = attr_map.get("href", "")
            self.links.append(href)
            if not href.startswith("https://") and not href.startswith("/articles/"):
                self.errors.append("外部リンクはHTTPS URLで指定してください")
        if tag not in VOID_TAGS:
            self.stack.append(tag)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if tag.lower() not in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "h2" and self._h2_buffer is not None:
            self.h2.append("".join(self._h2_buffer).strip())
            self._h2_buffer = None
        if tag in VOID_TAGS:
            return
        if not self.stack:
            self.errors.append(f"閉じタグの対応がありません: </{tag}>")
            return
        expected = self.stack.pop()
        if expected != tag:
            self.errors.append(f"HTMLタグの入れ子が不正です: <{expected}> を </{tag}> で閉じています")

    def handle_data(self, data: str) -> None:
        self.text.append(data)
        if self._h2_buffer is not None:
            self._h2_buffer.append(data)

    def finish(self) -> None:
        if self.stack:
            self.errors.append(f"閉じられていないタグがあります: {', '.join(self.stack)}")


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if re.fullmatch(r"[A-Z][A-Z0-9_]*", key):
            os.environ.setdefault(key, value)


def resolve_path(value: str | Path, base: Path = ROOT) -> Path:
    path = Path(value)
    return path if path.is_absolute() else (base / path).resolve()


def load_spec(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ToolError(f"記事仕様ファイルが見つかりません: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ToolError(f"記事仕様JSONが不正です: {exc}") from exc
    if not isinstance(data, dict):
        raise ToolError("記事仕様のルートはJSONオブジェクトである必要があります")
    return data


def read_body(spec: dict[str, Any]) -> str:
    body_file = spec.get("bodyFile")
    if not body_file:
        raise ToolError("bodyFile が記事仕様にありません")
    path = resolve_path(body_file)
    try:
        return path.read_text(encoding="utf-8").strip()
    except FileNotFoundError as exc:
        raise ToolError(f"本文HTMLが見つかりません: {path}") from exc


def run_board_generator(spec: dict[str, Any]) -> None:
    board = spec.get("board", {})
    if board.get("mode") == "manual":
        raise ToolError("この仕様は手制作の作戦盤を使用します。board.promptsFileの指示に従って画像を作成してください")
    generator = board.get("generator")
    if not generator:
        raise ToolError("board.generator が指定されていません")
    generator_path = resolve_path(generator)
    if not generator_path.exists():
        raise ToolError(f"作戦盤ジェネレーターが見つかりません: {generator_path}")
    completed = subprocess.run([sys.executable, str(generator_path)], cwd=ROOT, check=False)
    if completed.returncode != 0:
        raise ToolError(f"作戦盤生成に失敗しました: exit={completed.returncode}")


def inspect_html(body: str) -> ArticleHTMLInspector:
    inspector = ArticleHTMLInspector()
    inspector.feed(body)
    inspector.close()
    inspector.finish()
    return inspector


def validate_article(spec: dict[str, Any], body: str, require_publishable: bool = False) -> Report:
    errors: list[str] = []
    warnings: list[str] = []
    metrics: dict[str, Any] = {}

    title = str(spec.get("title", "")).strip()
    title_len = len(title)
    metrics["titleChars"] = title_len
    if not 30 <= title_len <= 55:
        errors.append(f"タイトルは30〜55文字です（現在{title_len}文字）")

    slug = str(spec.get("slug", ""))
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        errors.append("slugは半角小文字・数字・ハイフンのみで指定してください")

    content_types = spec.get("contentType")
    if not isinstance(content_types, list) or not content_types:
        errors.append("contentTypeは1件以上の配列で指定してください")
    elif any(item not in ALLOWED_CONTENT_TYPES for item in content_types):
        errors.append(f"未定義のcontentTypeがあります: {content_types}")

    summary = str(spec.get("summary", "")).strip()
    summary_lines = [line.strip() for line in summary.splitlines() if line.strip()]
    summary_len = len("".join(summary_lines))
    metrics["summaryChars"] = summary_len
    metrics["summaryLines"] = len(summary_lines)
    if len(summary_lines) != 3:
        errors.append(f"AI Tactical Summaryは3行必須です（現在{len(summary_lines)}行）")
    if not 100 <= summary_len <= 150:
        errors.append(f"要約は100〜150文字です（現在{summary_len}文字）")

    inspector = inspect_html(body)
    errors.extend(inspector.errors)
    youtube_links = [href for href in inspector.links if youtube_video_id(href)]
    video_count = len(inspector.iframes) + len(youtube_links)
    plain_text = re.sub(r"\s+", "", "".join(inspector.text))
    metrics.update({
        "bodyChars": len(plain_text),
        "h2Count": len(inspector.h2),
        "imageCount": len(inspector.images),
        "iframeCount": len(inspector.iframes),
        "youtubeLinkCount": len(youtube_links),
        "videoCount": video_count,
        "linkCount": len(inspector.links),
    })
    minimum_chars = int(spec.get("quality", {}).get("minimumBodyChars", 2400))
    if len(plain_text) < minimum_chars:
        errors.append(f"本文が短すぎます（{len(plain_text)}文字、最低{minimum_chars}文字）")

    required_sections = spec.get("quality", {}).get(
        "requiredSections", ["第1章", "第2章", "第3章", "第4章", "まとめ"]
    )
    for section in required_sections:
        if not any(section in heading for heading in inspector.h2):
            errors.append(f"必須セクションがありません: {section}")
    minimum_images = int(spec.get("quality", {}).get("minimumImages", 1))
    minimum_videos = int(
        spec.get("quality", {}).get(
            "minimumVideos",
            spec.get("quality", {}).get("minimumIframes", 2),
        )
    )
    if len(inspector.images) < minimum_images:
        errors.append(f"記事本文の画像が不足しています（現在{len(inspector.images)}枚、最低{minimum_images}枚）")
    if video_count < minimum_videos:
        errors.append(
            f"YouTube動画が不足しています（現在{video_count}本、最低{minimum_videos}本）。"
            "microCMS投稿用の通常リンクまたはiframeを指定してください"
        )

    visible_text = "".join(inspector.text)
    if re.search(r"</?(?:h[1-6]|p|strong|em|ul|ol|li|iframe|img|figure|table)\b[^>]*>", visible_text, re.IGNORECASE):
        errors.append("HTMLタグが本文中の文字として露出しています。コード装飾や二重エスケープを除去してください")
    if re.search(r"＜/?[A-Za-z][^＞]*＞", visible_text):
        errors.append("全角の＜＞で囲まれたHTMLタグが本文中に露出しています")

    for pattern in PLACEHOLDER_PATTERNS:
        if re.search(pattern, body) or re.search(pattern, json.dumps(spec, ensure_ascii=False)):
            errors.append(f"プレースホルダーが残っています: {pattern}")
    for banned, replacement in BANNED_TERMS.items():
        if banned in plain_text:
            errors.append(f"禁止表記「{banned}」があります。「{replacement}」へ統一してください")
    if plain_text.count("📌結論") or plain_text.count("📌 結論"):
        errors.append("AIテンプレ表現「📌 結論」は使用できません")

    for term in spec.get("quality", {}).get("requiredTerms", []):
        if term not in plain_text:
            errors.append(f"必須戦術用語が本文にありません: {term}")
    named_examples = spec.get("quality", {}).get("namedExamples", [])
    present_examples = [name for name in named_examples if name in plain_text]
    metrics["namedExamples"] = present_examples
    if len(present_examples) < int(spec.get("quality", {}).get("minimumNamedExamples", 3)):
        errors.append("実名選手・チームの具体例が不足しています")

    sources = spec.get("sourceUrls", [])
    if not isinstance(sources, list) or len(sources) < 2:
        errors.append("検証可能なsourceUrlsを2件以上指定してください")
    elif any(not str(url).startswith("https://") for url in sources):
        errors.append("sourceUrlsはHTTPS URLで指定してください")

    board = spec.get("board", {})
    board_mode = board.get("mode", "generated")
    asset_path_value = board.get("assetPath") or spec.get("eyecatchAssetPath")
    if board_mode == "manual":
        prompts_file = board.get("promptsFile")
        if not prompts_file or not resolve_path(prompts_file).exists():
            errors.append("手動作戦盤用の board.promptsFile が見つかりません")
        image_urls = board.get("imageUrls", [])
        if not image_urls:
            warnings.append("作戦盤画像はユーザー生成・挿入待ちです")
        elif any(not str(url).startswith("https://") for url in image_urls):
            errors.append("board.imageUrlsはHTTPS URLで指定してください")
    elif not asset_path_value:
        errors.append("board.assetPath がありません")
    else:
        asset_path = resolve_path(asset_path_value)
        if not asset_path.exists():
            errors.append(f"作戦盤画像が見つかりません: {asset_path}")
        else:
            size_bytes = asset_path.stat().st_size
            metrics["boardBytes"] = size_bytes
            try:
                from PIL import Image

                with Image.open(asset_path) as image:
                    width, height = image.size
                    dpi = image.info.get("dpi", (0, 0))
                metrics.update({"boardWidth": width, "boardHeight": height, "boardDpi": dpi})
                if abs((width / height) - (16 / 9)) > 0.002:
                    errors.append(f"作戦盤は16:9必須です（現在{width}x{height}）")
                if width < 1600 or height < 900:
                    errors.append("作戦盤の解像度は最低1600x900です")
                if min(dpi or (0, 0)) < 299:
                    warnings.append(f"作戦盤DPIが300未満です: {dpi}")
            except ImportError:
                warnings.append("Pillowがないため画像寸法を検証できません")
            if size_bytes > 5 * 1024 * 1024:
                errors.append("microCMSメディアAPIの5MB上限を超えています")

    eyecatch_url = str(spec.get("eyecatch", {}).get("url", ""))
    if require_publishable and not eyecatch_url:
        warnings.append("公開時は --upload-media または eyecatch.url が必要です")
    if eyecatch_url and not eyecatch_url.startswith("https://images.microcms-assets.io/"):
        warnings.append("eyecatch.urlがmicroCMS標準画像ドメインではありません。カスタムドメイン設定を確認してください")

    return Report(errors=errors, warnings=warnings, metrics=metrics)


def replace_board_url(spec: dict[str, Any], body: str, media_url: str | None) -> str:
    if not media_url:
        return body
    public_url = str(spec.get("board", {}).get("publicUrl", ""))
    if not public_url:
        raise ToolError("アップロード画像へ置換するための board.publicUrl がありません")
    if public_url not in body:
        raise ToolError("本文内に board.publicUrl が見つからないため画像URLを置換できません")
    return body.replace(public_url, media_url)


def build_payload(spec: dict[str, Any], body: str, eyecatch_url: str | None = None) -> dict[str, Any]:
    # microCMSのリッチエディタはContent API経由のiframeを除去するため、
    # YouTube埋め込みは安全な通常リンクとして保存し、フロント側でiframeへ戻す。
    iframe_pattern = re.compile(r'<iframe\b(?P<attrs>[^>]*)>\s*</iframe>', re.IGNORECASE | re.DOTALL)

    def iframe_to_youtube_link(match: re.Match[str]) -> str:
        attrs = match.group("attrs")
        src_match = re.search(r'\bsrc=["\']([^"\']+)["\']', attrs, re.IGNORECASE)
        if not src_match:
            return match.group(0)
        video_id = youtube_video_id(html.unescape(src_match.group(1)))
        if not video_id:
            return match.group(0)
        title_match = re.search(r'\btitle=["\']([^"\']*)["\']', attrs, re.IGNORECASE)
        title = html.unescape(title_match.group(1)).strip() if title_match else "NBA tactics video"
        return f'<p><a href="https://www.youtube.com/watch?v={video_id}">{html.escape(title)}</a></p>'

    cms_body = iframe_pattern.sub(iframe_to_youtube_link, body)
    payload: dict[str, Any] = {
        "title": spec["title"],
        "slug": spec["slug"],
        "contentType": spec["contentType"],
        "summary": spec["summary"],
        "body": cms_body,
    }
    for key in ("seoTitle", "publishedAt"):
        if spec.get(key):
            payload[key] = spec[key]
    sources = spec.get("sourceUrls", [])
    if sources and spec.get("fields", {}).get("sourceUrls", True):
        payload["sourceUrls"] = "\n".join(sources)
    final_eyecatch = eyecatch_url or spec.get("eyecatch", {}).get("url")
    if final_eyecatch:
        payload["eyecatch"] = final_eyecatch
    payload.update(spec.get("extraFields", {}))
    return payload


def artifact_dir(spec: dict[str, Any], override: str | None = None) -> Path:
    return resolve_path(override) if override else ROOT / "build" / "articles" / spec["slug"]


def write_artifacts(spec: dict[str, Any], body: str, report: Report, output_dir: Path, payload: dict[str, Any]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "body.html").write_text(body + "\n", encoding="utf-8")
    (output_dir / "payload.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output_dir / "quality-report.json").write_text(json.dumps(report.as_dict(), ensure_ascii=False, indent=2, default=str) + "\n", encoding="utf-8")


def require_microcms_config() -> tuple[str, str]:
    domain = os.getenv("MICROCMS_SERVICE_DOMAIN", "").strip()
    api_key = os.getenv("MICROCMS_API_KEY", "").strip()
    if not domain or not api_key or domain.startswith("YOUR_") or api_key.startswith("YOUR_"):
        raise ToolError("MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY を環境変数または .env.local に設定してください")
    return domain, api_key


def request_json(method: str, url: str, api_key: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"X-MICROCMS-API-KEY": api_key, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:1000]
        raise ToolError(f"microCMS APIエラー: HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise ToolError(f"microCMSへ接続できません: {exc.reason}") from exc
    return json.loads(raw) if raw else {}


def upload_media(domain: str, api_key: str, path: Path) -> str:
    if path.stat().st_size > 5 * 1024 * 1024:
        raise ToolError("メディアAPIへアップロードできる上限は5MBです")
    boundary = f"----nba-tactics-lab-{uuid.uuid4().hex}"
    mime = "image/png" if path.suffix.lower() == ".png" else "application/octet-stream"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{path.name}"\r\n'
        f"Content-Type: {mime}\r\n\r\n"
    ).encode("utf-8") + path.read_bytes() + f"\r\n--{boundary}--\r\n".encode("utf-8")
    request = urllib.request.Request(
        f"https://{domain}.microcms-management.io/api/v1/media",
        data=body,
        method="POST",
        headers={
            "X-MICROCMS-API-KEY": api_key,
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:1000]
        raise ToolError(f"メディアアップロード失敗: HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise ToolError(f"メディアAPIへ接続できません: {exc.reason}") from exc
    url = result.get("url", "")
    if not url.startswith("https://"):
        raise ToolError("メディアAPIから有効なURLが返りませんでした")
    return url


def find_existing(domain: str, api_key: str, endpoint: str, slug: str) -> list[dict[str, Any]]:
    query = urllib.parse.urlencode({"filters": f"slug[equals]{slug}", "limit": 2})
    result = request_json("GET", f"https://{domain}.microcms.io/api/v1/{endpoint}?{query}", api_key)
    contents = result.get("contents", [])
    return contents if isinstance(contents, list) else []


def print_report(report: Report) -> None:
    print(json.dumps(report.as_dict(), ensure_ascii=False, indent=2, default=str))


def command_validate(args: argparse.Namespace) -> int:
    spec = load_spec(resolve_path(args.spec))
    if args.generate_board:
        run_board_generator(spec)
    report = validate_article(spec, read_body(spec))
    print_report(report)
    return 0 if report.ok else 2


def command_build(args: argparse.Namespace) -> int:
    spec = load_spec(resolve_path(args.spec))
    if args.generate_board:
        run_board_generator(spec)
    body = read_body(spec)
    report = validate_article(spec, body)
    payload = build_payload(spec, body)
    output = artifact_dir(spec, args.output_dir)
    write_artifacts(spec, body, report, output, payload)
    print_report(report)
    print(f"Artifacts: {output}")
    return 0 if report.ok else 2


def command_publish(args: argparse.Namespace) -> int:
    spec = load_spec(resolve_path(args.spec))
    slug = spec.get("slug", "")
    if args.confirm_slug != slug:
        raise ToolError(f"--confirm-slug に完全なslugを指定してください: {slug}")
    if args.status == "publish" and args.confirm_publish != slug:
        raise ToolError(f"本番公開には --confirm-publish {slug} が必要です")
    if args.generate_board:
        run_board_generator(spec)

    body = read_body(spec)
    initial_report = validate_article(spec, body, require_publishable=True)
    if not initial_report.ok:
        print_report(initial_report)
        raise ToolError("品質検査に失敗したため送信しません")

    output = artifact_dir(spec, args.output_dir)
    if not args.execute:
        payload = build_payload(spec, body)
        write_artifacts(spec, body, initial_report, output, payload)
        print("DRY RUN: ネットワーク変更は行っていません。実行には --execute が必要です。")
        print(f"Planned status: {args.status}")
        print(f"Artifacts: {output}")
        return 0

    if not args.allow_create and not args.allow_update:
        raise ToolError("--execute には --allow-create または --allow-update のどちらかが必要です")

    domain, api_key = require_microcms_config()
    endpoint = args.endpoint or spec.get("endpoint", DEFAULT_ENDPOINT)
    content_id = spec.get("contentId")
    existing = [] if content_id else find_existing(domain, api_key, endpoint, slug)
    if len(existing) > 1:
        raise ToolError("同一slugの記事が複数あります。contentIdを記事仕様へ明示してください")
    if existing:
        content_id = existing[0].get("id")
    if content_id and not args.allow_update:
        raise ToolError("既存記事が見つかりました。更新には --allow-update が必要です")
    if not content_id and not args.allow_create:
        raise ToolError("新規記事の作成には --allow-create が必要です")

    media_url: str | None = None
    if args.upload_media:
        if spec.get("board", {}).get("mode") == "manual":
            raise ToolError("手制作の作戦盤では --upload-media を使用しません。画像はmicroCMS上で手動挿入してください")
        board_path = resolve_path(spec.get("board", {}).get("assetPath") or spec.get("eyecatchAssetPath"))
        media_url = upload_media(domain, api_key, board_path)
        body = replace_board_url(spec, body, media_url)
    else:
        media_url = spec.get("eyecatch", {}).get("url")
    if not media_url and not content_id:
        raise ToolError("eyecatchは必須です。--upload-media または eyecatch.url を指定してください")

    final_report = validate_article(spec, body)
    if not final_report.ok:
        print_report(final_report)
        raise ToolError("画像URL解決後の品質検査に失敗したため送信しません")
    payload = build_payload(spec, body, media_url)
    write_artifacts(spec, body, final_report, output, payload)

    status_query = "?status=draft" if args.status == "draft" else ""
    base_url = f"https://{domain}.microcms.io/api/v1/{endpoint}"
    if content_id:
        result = request_json("PATCH", f"{base_url}/{content_id}{status_query}", api_key, payload)
        action = "updated"
    else:
        result = request_json("POST", f"{base_url}{status_query}", api_key, payload)
        action = "created"
    print(json.dumps({"success": True, "action": action, "status": args.status, "id": result.get("id")}, ensure_ascii=False, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="NBA TACTICS LAB 記事制作・品質検査・microCMS投稿ツール")
    parser.add_argument("--env-file", default=str(ROOT / ".env.local"), help="環境変数ファイル")
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate = subparsers.add_parser("validate", help="本文・メタデータ・作戦盤を検査")
    validate.add_argument("--spec", default=str(DEFAULT_SPEC))
    validate.add_argument("--generate-board", action="store_true")
    validate.set_defaults(func=command_validate)

    build = subparsers.add_parser("build", help="検査済みmicroCMS payloadをローカル生成")
    build.add_argument("--spec", default=str(DEFAULT_SPEC))
    build.add_argument("--generate-board", action="store_true")
    build.add_argument("--output-dir")
    build.set_defaults(func=command_build)

    publish = subparsers.add_parser("publish", help="microCMSへ安全に下書き・公開送信")
    publish.add_argument("--spec", default=str(DEFAULT_SPEC))
    publish.add_argument("--endpoint", default=DEFAULT_ENDPOINT)
    publish.add_argument("--status", choices=("draft", "publish"), default="draft")
    publish.add_argument("--generate-board", action="store_true")
    publish.add_argument("--upload-media", action="store_true")
    publish.add_argument("--allow-create", action="store_true")
    publish.add_argument("--allow-update", action="store_true")
    publish.add_argument("--confirm-slug", required=True)
    publish.add_argument("--confirm-publish")
    publish.add_argument("--execute", action="store_true")
    publish.add_argument("--output-dir")
    publish.set_defaults(func=command_publish)
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    load_env_file(resolve_path(args.env_file))
    try:
        return int(args.func(args))
    except ToolError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

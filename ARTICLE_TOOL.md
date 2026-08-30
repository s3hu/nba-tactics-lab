# NBA TACTICS LAB 記事制作ツール

`generate_nba_article.py` は、記事本文・メタデータ・作戦盤指示を検査し、microCMS用payloadを生成し、必要な場合だけmicroCMSへ送信するCLIです。既存サイトのCSSやコンポーネントは変更しません。作戦盤はプロンプトと挿入位置を出力し、画像生成とmicroCMSへの挿入は編集者が行う運用を標準とします。

## 安全設計

- `validate` と `build` はネットワークを使用しません。
- `publish` も既定はドライランです。`--execute` がない限りmicroCMSを変更しません。
- 新規作成には `--allow-create`、既存記事更新には `--allow-update` が必要です。
- 既定の送信先は下書きです。本番公開には `--status publish` と `--confirm-publish <slug>` の両方が必要です。
- APIキーは `.env.local` から読み込み、ログや生成ファイルには書き出しません。

## 必要環境

```powershell
python -m pip install -r requirements-article-tool.txt
```

`.env.local` に以下を設定します。

```text
MICROCMS_SERVICE_DOMAIN=サービスID
MICROCMS_API_KEY=APIキー
```

APIキーには、利用する処理に応じてContent APIのGET・POST・PATCH権限と、Management APIのメディアアップロード権限が必要です。メディアAPIは対応するmicroCMSプランでのみ利用できます。

## 1. 品質検査

```powershell
python generate_nba_article.py validate `
  --spec content-drafts/spain-pnr-drop-defense-phoenix-suns.metadata.json
```

検査内容には、タイトル・3行要約の文字数、必須章、用語統一、実名例、YouTube動画数、プレースホルダー、HTML安全性、HTMLタグの文字露出が含まれます。microCMSのWRITE APIではiframeが除去されるため、動画は単独のYouTubeリンクとして保存し、記事ページの描画時に埋め込みへ変換します。自動生成モードの画像では16:9・解像度・DPI・5MB制限も検査します。

スペインP&R記事の作戦盤指示は `content-drafts/spain-pnr-board-prompts.md` にあります。各プロンプトはハンドラー侵入、ロブ、ポップアウトを別画像に分け、本文内の挿入位置も指定しています。

## 2. microCMS payloadのローカル生成

```powershell
python generate_nba_article.py build `
  --spec content-drafts/spain-pnr-drop-defense-phoenix-suns.metadata.json
```

生成物は `build/articles/<slug>/` に保存されます。このディレクトリは既存の `.gitignore` で除外されています。

## 3. microCMS下書き投稿

最初にドライランします。

```powershell
python generate_nba_article.py publish `
  --spec content-drafts/spain-pnr-drop-defense-phoenix-suns.metadata.json `
  --confirm-slug spain-pick-and-roll-mechanics `
  --allow-update
```

内容を確認した後、同じコマンドへ `--execute` を追加すると、公開中の記事を維持したまま下書き版を更新します。

既存記事を更新する場合は `--allow-create` ではなく `--allow-update` を指定します。記事仕様へ `contentId` を記録すると、非公開記事を含めて更新対象を一意にできます。

## 4. 本番公開

```powershell
python generate_nba_article.py publish `
  --spec content-drafts/spain-pnr-drop-defense-phoenix-suns.metadata.json `
  --status publish `
  --confirm-slug spain-pick-and-roll-mechanics `
  --confirm-publish spain-pick-and-roll-mechanics `
  --allow-update `
  --execute
```

通常運用では、本番公開ではなく下書き投稿までを自動化し、microCMS管理画面で最終確認して公開する運用を推奨します。

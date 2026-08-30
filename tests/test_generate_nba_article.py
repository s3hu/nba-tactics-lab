import copy
import importlib.util
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "generate_nba_article.py"
SPEC_PATH = ROOT / "content-drafts" / "spain-pnr-drop-defense-phoenix-suns.metadata.json"

module_spec = importlib.util.spec_from_file_location("nba_article_tool", MODULE_PATH)
article_tool = importlib.util.module_from_spec(module_spec)
assert module_spec and module_spec.loader
sys.modules[module_spec.name] = article_tool
module_spec.loader.exec_module(article_tool)


class ArticleToolTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.spec = article_tool.load_spec(SPEC_PATH)
        cls.body = article_tool.read_body(cls.spec)

    def test_current_spain_article_passes_quality_gate(self):
        report = article_tool.validate_article(self.spec, self.body)
        self.assertTrue(report.ok, report.errors)
        self.assertEqual(report.metrics["videoCount"], 3)
        self.assertEqual(report.metrics["youtubeLinkCount"], 3)

    def test_youtube_url_variants_are_recognized(self):
        self.assertEqual(article_tool.youtube_video_id("https://youtu.be/M3EJyFzYDU8"), "M3EJyFzYDU8")
        self.assertEqual(
            article_tool.youtube_video_id("https://www.youtube.com/watch?v=W3nHqWA3vJk"),
            "W3nHqWA3vJk",
        )
        self.assertIsNone(article_tool.youtube_video_id("https://example.com/watch?v=M3EJyFzYDU8"))

    def test_summary_requires_exactly_three_lines(self):
        invalid = copy.deepcopy(self.spec)
        invalid["summary"] = "1行だけの要約"
        report = article_tool.validate_article(invalid, self.body)
        self.assertFalse(report.ok)
        self.assertTrue(any("3行必須" in error for error in report.errors))

    def test_placeholder_is_rejected(self):
        report = article_tool.validate_article(self.spec, self.body + "<p>{{VIDEO_TITLE}}</p>")
        self.assertFalse(report.ok)
        self.assertTrue(any("プレースホルダー" in error for error in report.errors))

    def test_unsafe_html_is_rejected(self):
        report = article_tool.validate_article(self.spec, self.body + "<script>alert(1)</script>")
        self.assertFalse(report.ok)
        self.assertTrue(any("禁止" in error or "許可されていない" in error for error in report.errors))

    def test_visible_html_tag_text_is_rejected(self):
        report = article_tool.validate_article(self.spec, self.body + "<code>&lt;h2&gt;露出タグ&lt;/h2&gt;</code>")
        self.assertFalse(report.ok)
        self.assertTrue(any("文字として露出" in error for error in report.errors))

    def test_payload_uses_microcms_image_url(self):
        image_url = "https://images.microcms-assets.io/assets/example/board.png"
        payload = article_tool.build_payload(self.spec, self.body, image_url)
        self.assertEqual(payload["eyecatch"], image_url)


if __name__ == "__main__":
    unittest.main()

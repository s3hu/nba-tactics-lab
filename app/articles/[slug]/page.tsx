import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
};

// microCMS から記事詳細を取得
async function getArticle(slug: string) {
  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY;

  if (!serviceDomain || !apiKey) return null;

  try {
    // 1. スラッグで検索
    const filterRes = await fetch(
      `https://${serviceDomain}.microcms.io/api/v1/articles?filters=slug[equals]${slug}`,
      {
        headers: { "X-MICROCMS-API-KEY": apiKey },
        next: { revalidate: 0 },
      }
    );

    if (filterRes.ok) {
      const filterData = await filterRes.json();
      if (filterData.contents && filterData.contents.length > 0) {
        return filterData.contents[0];
      }
    }

    // 2. IDで直接取得
    const directRes = await fetch(
      `https://${serviceDomain}.microcms.io/api/v1/articles/${slug}`,
      {
        headers: { "X-MICROCMS-API-KEY": apiKey },
        next: { revalidate: 0 },
      }
    );

    if (directRes.ok) {
      return await directRes.json();
    }

    return null;
  } catch (error) {
    return null;
  }
}

// SEOメタデータの生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) return { title: "Not Found" };

  const seoTitle = article.seoTitle || article.title;
  const description =
    article.summary || article.description || `${article.title}の解説記事です。`;

  return {
    title: seoTitle,
    description: description,
  };
}

// 記事詳細ページ
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  // microCMS の各フィールドからAI要約を抽出
  const aiSummary =
    article.summary ||
    article.aiSummary ||
    article.ai_summary ||
    article.description ||
    article.excerpt;

  // 本文HTMLを取得
  const mainContent =
    article.content || article.body || article.text || "";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* パンくずリスト風ナビゲーション */}
      <nav className="text-xs text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:underline text-gray-600">
          HOME
        </Link>
        <span>/</span>
        <span className="uppercase text-blue-600 font-semibold">
          {article.category?.label || article.category?.name || "TACTICS"}
        </span>
      </nav>

      <article>
        {/* 公開日 */}
        <p className="text-sm text-gray-500 mb-2">
          {new Date(article.publishedAt || article.createdAt).toLocaleDateString(
            "ja-JP",
            { year: "numeric", month: "long", day: "numeric" }
          )}
        </p>

        {/* タイトル */}
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-8">
          {article.title}
        </h1>

        {/* AI 3行要約ボックス */}
        {aiSummary && (
          <section className="mb-10 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-blue-900 font-bold text-sm tracking-wider uppercase">
              <span className="text-lg">✨</span>
              <span>AI 要約</span>
            </div>
            <p className="text-gray-800 leading-relaxed text-base whitespace-pre-wrap">
              {aiSummary}
            </p>
          </section>
        )}

        {/* 記事本文 */}
        <div
          className="prose prose-lg max-w-none text-gray-800 leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: mainContent }}
        />
      </article>

      {/* 戻るリンク */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          ← 記事一覧に戻る
        </Link>
      </div>
    </div>
  );
}
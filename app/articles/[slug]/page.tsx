import { Metadata } from "next";
import { notFound } from "next/navigation";

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
        next: { revalidate: 10 },
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
        next: { revalidate: 10 },
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

// SEOメタデータ
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) return { title: "Not Found" };

  const seoTitle = article.seoTitle || article.title;
  const description = article.summary || article.description || `${article.title}の解説記事です。`;

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

  // microCMS側のどのフィールド名に入っていても拾えるようにする
  const aiSummary = article.summary || article.description || article.aiSummary || article.ai_summary;

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {/* 記事タイトル */}
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        {article.title}
      </h1>

      {/* 公開日 */}
      <p className="text-sm text-gray-500 mb-8">
        公開日: {new Date(article.publishedAt || article.createdAt).toLocaleDateString("ja-JP")}
      </p>

      {/* AI 要約ブロック */}
      {aiSummary && (
        <div className="mb-10 p-6 bg-blue-50/80 border border-blue-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-blue-900 font-bold text-sm tracking-wide uppercase">
            <span className="text-lg">✨</span>
            <span>AI 要約</span>
          </div>
          <p className="text-gray-800 leading-relaxed text-base">
            {aiSummary}
          </p>
        </div>
      )}

      {/* 記事本文 */}
      <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
        {typeof article.content === "string" ? (
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        ) : article.body ? (
          <div dangerouslySetInnerHTML={{ __html: article.body }} />
        ) : null}
      </div>
    </article>
  );
}
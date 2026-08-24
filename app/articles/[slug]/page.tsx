import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Article } from "@/types";

type Props = {
  params: Promise<{ slug: string }>;
};

// microCMS から記事詳細を取得
async function getArticle(slug: string): Promise<Article | null> {
  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY;

  if (!serviceDomain || !apiKey) return null;

  try {
    const res = await fetch(
      `https://${serviceDomain}.microcms.io/api/v1/articles/${slug}`,
      {
        headers: {
          "X-MICROCMS-API-KEY": apiKey,
        },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();

    return {
      slug: data.id,
      title: data.title,
      excerpt: data.summary || "",
      publishedAt: data.publishedAt || data.createdAt,
      thumbnailUrl: data.thumbnail?.url || "",
      categoryId: data.category?.id || "uncategorized",
      tags: data.tags || [],
      content: data.content || [],
      seoTitle: data.seoTitle,
      summary: data.summary,
    };
  } catch (error) {
    return null;
  }
}

// SEOメタデータの動的生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) return { title: "Not Found" };

  return {
    title: article.seoTitle || article.title,
    description: article.summary || article.excerpt || `${article.title}の解説記事です。`,
  };
}

// 記事詳細ページ
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {/* 記事タイトル */}
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        {article.title}
      </h1>

      {/* 公開日 */}
      <p className="text-sm text-gray-500 mb-8">
        公開日: {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
      </p>

      {/* AI 3行要約ブロック */}
      {article.summary && (
        <div className="mb-10 p-6 bg-blue-50/70 border border-blue-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-blue-900 font-bold text-sm tracking-wide uppercase">
            <span>✨</span>
            <span>AI 要約</span>
          </div>
          <p className="text-gray-800 leading-relaxed text-base">
            {article.summary}
          </p>
        </div>
      )}

      {/* 記事本文 */}
      <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
        {typeof article.content === "string" ? (
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        ) : (
          <div>{JSON.stringify(article.content)}</div>
        )}
      </div>
    </article>
  );
}
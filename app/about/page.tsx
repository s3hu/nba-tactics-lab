import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { client, Article } from "@/lib/microcms";
import { CATEGORIES } from "@/lib/data/categories";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdBanner } from "@/components/ad-banner";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

// 記事詳細を取得
async function getArticleData(slug: string): Promise<Article | null> {
  try {
    const data = await client.getList<Article>({
      endpoint: "articles",
      queries: {
        filters: `slug[equals]${slug}`,
        limit: 1,
      },
    });
    return data.contents[0] || null;
  } catch (e) {
    return null;
  }
}

// 同じカテゴリーの関連記事を取得（最大3件）
async function getRelatedArticles(
  categoryName: string,
  currentArticleId: string
): Promise<Article[]> {
  try {
    const data = await client.getList<Article>({
      endpoint: "articles",
      queries: {
        filters: `contentType[contains]${categoryName}[and]id[not_equals]${currentArticleId}`,
        limit: 3,
        orders: "-publishedAt",
      },
    });
    return data.contents;
  } catch (e) {
    return [];
  }
}

// SEO・OGPメタデータの動的生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleData(slug);

  if (!article) return { title: "Not Found" };

  const pageTitle = (article as any).seoTitle || article.title;
  const description =
    (article as any).summary ||
    (article as any).description ||
    `${article.title}の戦術解説記事です。`;
  const ogImage =
    article.eyecatch?.url ||
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=85";

  return {
    title: `${pageTitle} | NBA TACTICS LAB`,
    description: description,
    openGraph: {
      title: pageTitle,
      description: description,
      type: "article",
      publishedTime: article.publishedAt,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: description,
      images: [ogImage],
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleData(slug);

  if (!article) {
    notFound();
  }

  const categoryLabel = Array.isArray(article.contentType)
    ? article.contentType[0]
    : article.contentType || "TACTICS";

  // 関連記事を取得
  const relatedArticles = await getRelatedArticles(categoryLabel, article.id);

  // AI要約の取得
  const aiSummary =
    (article as any).summary ||
    (article as any).aiSummary ||
    (article as any).ai_summary ||
    (article as any).description;

  return (
    <div className="min-h-screen bg-[#0d0f12] text-white flex flex-col font-sans">
      <SiteHeader categories={CATEGORIES} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* パンくずリスト */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors">
            HOME
          </Link>
          <span>/</span>
          <span className="text-blue-400 uppercase">{categoryLabel}</span>
        </div>

        {/* 記事ヘッダー */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
              {categoryLabel}
            </span>
            <time className="text-xs font-mono text-zinc-400">
              {new Date(article.publishedAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight mb-6">
            {article.title}
          </h1>

          {/* アイキャッチ画像 */}
          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 mb-8">
            <img
              src={
                article.eyecatch?.url
                  ? `${article.eyecatch.url}?w=1200&fm=webp&q=85`
                  : "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=85"
              }
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* ✨ AI 要約ブロック */}
          {aiSummary && (
            <div className="p-5 sm:p-6 rounded-2xl bg-blue-950/30 border border-blue-500/30 backdrop-blur-sm mb-8 shadow-lg shadow-blue-950/20">
              <div className="flex items-center gap-2 mb-2.5 text-blue-400 font-bold text-xs font-mono tracking-wider uppercase">
                <span className="text-base">✨</span>
                <span>AI Summary / 3行要約</span>
              </div>
              <p className="text-zinc-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                {aiSummary}
              </p>
            </div>
          )}
        </header>

        {/* 記事本文 */}
        <article
          className="prose prose-invert max-w-none 
            prose-headings:font-bold prose-headings:text-white
            prose-h2:text-2xl prose-h2:border-b prose-h2:border-zinc-800 prose-h2:pb-3 prose-h2:mt-10
            prose-h3:text-xl prose-h3:mt-6
            prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-base
            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-ul:text-zinc-300 prose-ol:text-zinc-300
            prose-img:rounded-xl prose-img:border prose-img:border-zinc-800"
          dangerouslySetInnerHTML={{ __html: article.body || "" }}
        />

        {/* 💡 広告・アフィリエイト枠 */}
        <AdBanner />

        {/* 関連記事セクション */}
        {relatedArticles.length > 0 && (
          <section className="mt-16 pt-10 border-t border-zinc-800">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              こちらの記事もおすすめ
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/articles/${rel.slug}`}
                  className="group block bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition"
                >
                  <div className="aspect-video w-full overflow-hidden bg-zinc-800">
                    <img
                      src={
                        rel.eyecatch?.url
                          ? `${rel.eyecatch.url}?w=500&fm=webp&q=80`
                          : "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&auto=format&fit=crop&q=80"
                      }
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-3.5">
                    <h3 className="text-xs font-bold text-zinc-200 group-hover:text-blue-400 line-clamp-2 transition-colors">
                      {rel.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 戻るボタン */}
        <div className="mt-12 pt-8 border-t border-zinc-800 flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            ← 記事一覧に戻る
          </Link>
        </div>
      </main>

      <SiteFooter categories={CATEGORIES} />
    </div>
  );
}
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import parse from "html-react-parser";
import { client, Article } from "@/lib/microcms";
import { CATEGORIES } from "@/lib/data/categories";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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

// HTML特殊文字とマークダウンの正規化
function cleanAndFormatContent(content: string = ""): string {
  if (!content) return "";

  let clean = content
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

  clean = clean
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-blue-300 mt-8 mb-4">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-extrabold text-white mt-12 mb-6 pb-3 border-b border-zinc-800 flex items-center gap-2"><span class="w-1.5 h-6 bg-blue-500 rounded-full inline-block"></span>$1</h2>')
    .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-zinc-300 my-2">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-zinc-300 my-2">$1</li>');

  return clean;
}

// SEO・OGPメタデータの動的生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleData(slug);

  if (!article) return { title: "Not Found" };

  const pageTitle = (article as any).seoTitle || article.title;
  const description =
    (article as any).summary ||
    (article as any).aiSummary ||
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

  const relatedArticles = await getRelatedArticles(categoryLabel, article.id);

  const aiSummary =
    (article as any).summary ||
    (article as any).aiSummary ||
    (article as any).ai_summary ||
    (article as any).description;

  const cleanedHtml = cleanAndFormatContent(article.body || "");

  return (
    <div className="min-h-screen bg-[#0d0f12] text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <SiteHeader categories={CATEGORIES} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* パンくずリスト */}
        <nav className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors">
            HOME
          </Link>
          <span>/</span>
          <span className="text-blue-400 uppercase font-semibold">{categoryLabel}</span>
        </nav>

        {/* 記事ヘッダー */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
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

          <h1 className="text-2.5xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight mb-6">
            {article.title}
          </h1>

          {/* アイキャッチ画像 */}
          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 mb-8 shadow-xl shadow-black/40">
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

          {/* AI 要約ブロック */}
          {aiSummary && (
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-950/40 to-zinc-900/50 border border-blue-500/30 backdrop-blur-sm mb-8 shadow-lg shadow-blue-950/20">
              <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold text-xs font-mono tracking-wider uppercase">
                <span className="text-base">✨</span>
                <span>AI Tactical Summary / 3行要約</span>
              </div>
              <div className="text-zinc-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap space-y-1.5 font-sans">
                {aiSummary}
              </div>
            </div>
          )}
        </header>

        {/* 記事本文 */}
        <article
          className="prose prose-invert max-w-none
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white
            prose-h2:text-2xl prose-h2:border-b prose-h2:border-zinc-800 prose-h2:pb-3 prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-blue-50
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-zinc-100
            prose-p:text-zinc-300 prose-p:leading-8 prose-p:text-base prose-p:my-5
            prose-a:text-blue-400 prose-a:font-medium prose-a:underline-offset-4 hover:prose-a:text-blue-300
            prose-strong:text-white prose-strong:font-bold prose-strong:bg-zinc-800/60 prose-strong:px-1 prose-strong:py-0.5 prose-strong:rounded
            prose-ul:text-zinc-300 prose-ul:my-5 prose-ul:space-y-2
            prose-ol:text-zinc-300 prose-ol:my-5 prose-ol:space-y-2
            prose-li:leading-relaxed
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-zinc-900/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:text-zinc-300 prose-blockquote:not-italic
            prose-img:rounded-2xl prose-img:border prose-img:border-zinc-800 prose-img:shadow-lg prose-img:my-8"
        >
          {parse(cleanedHtml)}
        </article>

        {/* 関連記事セクション */}
        {relatedArticles.length > 0 && (
          <section className="mt-16 pt-10 border-t border-zinc-800">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              こちらの戦術記事もおすすめ
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/articles/${rel.slug}`}
                  className="group block bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 hover:bg-zinc-900 transition duration-200"
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
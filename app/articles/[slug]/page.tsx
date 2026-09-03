import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import parse, { Element, Text, type HTMLReactParserOptions } from "html-react-parser";
import { client, Article } from "@/lib/microcms";
import { CATEGORIES } from "@/lib/data/categories";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

function getYouTubeVideoId(href: string): string | null {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId: string | null = null;

    if (hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || null;
    } else if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v");
      } else {
        const pathParts = url.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(pathParts[0])) {
          videoId = pathParts[1] || null;
        }
      }
    }

    return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

const articleParserOptions: HTMLReactParserOptions = {
  replace(domNode) {
    if (!(domNode instanceof Element) || domNode.name !== "p") return;

    const meaningfulChildren = domNode.children.filter(
      (child) => !(child instanceof Text && child.data.trim() === ""),
    );
    if (meaningfulChildren.length !== 1) return;

    const link = meaningfulChildren[0];
    if (!(link instanceof Element) || link.name !== "a") return;

    const videoId = getYouTubeVideoId(link.attribs.href || "");
    if (!videoId) return;

    const title = link.children
      .filter((child): child is Text => child instanceof Text)
      .map((child) => child.data.trim())
      .filter(Boolean)
      .join(" ") || "NBA tactics video";

    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  },
};

async function getArticleData(slug: string): Promise<Article | null> {
  try {
    const data = await client.getList<Article>({
      endpoint: "articles",
      queries: { filters: `slug[equals]${slug}`, limit: 1 },
    });
    return data.contents[0] || null;
  } catch {
    return null;
  }
}

async function getRelatedArticles(categoryName: string, currentArticleId: string): Promise<Article[]> {
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
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleData(slug);
  if (!article) return { title: "Not Found" };

  const pageTitle = (article as any).seoTitle || article.title;
  const description = (article as any).summary || (article as any).aiSummary || article.title;
  const ogImage = article.eyecatch?.url || "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=85";

  return {
    title: `${pageTitle} | NBA TACTICS LAB`,
    description: description,
    openGraph: {
      title: pageTitle,
      description: description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleData(slug);

  if (!article) notFound();

  const categoryLabel = Array.isArray(article.contentType) ? article.contentType[0] : article.contentType || "TACTICS";
  const relatedArticles = await getRelatedArticles(categoryLabel, article.id);
  const aiSummary = (article as any).summary || (article as any).aiSummary || (article as any).description;

  return (
    <div className="min-h-screen bg-[#0d0f12] text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* TailwindのリセットCSSを強制上書きする記事専用スタイル */}
      <style dangerouslySetInnerHTML={{ __html: `
        .article-content h2 {
          font-size: 1.85rem !important;
          font-weight: 800 !important;
          color: #ffffff !important;
          margin-top: 4rem !important;
          margin-bottom: 1.5rem !important;
          padding-top: 1.5rem !important;
          border-top: 1px solid #27272a !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.75rem !important;
          line-height: 1.3 !important;
        }
        .article-content h2::before {
          content: "";
          display: inline-block;
          width: 6px;
          height: 1.6rem;
          background-color: #3b82f6;
          border-radius: 2px;
          flex-shrink: 0;
        }
        .article-content h3 {
          font-size: 1.35rem !important;
          font-weight: 700 !important;
          color: #60a5fa !important;
          margin-top: 2.5rem !important;
          margin-bottom: 1rem !important;
          line-height: 1.4 !important;
        }
        .article-content p {
          font-size: 1.05rem !important;
          line-height: 2.2 !important;
          color: #d4d4d8 !important;
          margin-bottom: 1.75rem !important;
        }
        .article-content strong {
          color: #93c5fd !important;
          font-weight: 700 !important;
          background-color: rgba(30, 58, 138, 0.35) !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
        }
        .article-content a {
          color: #60a5fa !important;
          font-weight: 600 !important;
          text-decoration: underline !important;
          text-decoration-color: rgba(96, 165, 250, 0.55) !important;
          text-underline-offset: 3px !important;
          transition: color 0.2s ease, text-decoration-color 0.2s ease !important;
        }
        .article-content a:hover {
          color: #93c5fd !important;
          text-decoration-color: #93c5fd !important;
        }
        .article-content ul {
          margin: 1.5rem 0 !important;
          padding-left: 1.5rem !important;
          list-style-type: disc !important;
          color: #d4d4d8 !important;
        }
        .article-content li {
          margin-bottom: 0.75rem !important;
          line-height: 1.9 !important;
        }
        .article-content table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 2.5rem 0 !important;
          background-color: rgba(24, 24, 27, 0.6) !important;
          border: 1px solid #27272a !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }
        .article-content th {
          background-color: #27272a !important;
          color: #60a5fa !important;
          padding: 14px 16px !important;
          font-weight: 700 !important;
          text-align: left !important;
          font-size: 0.9rem !important;
          border-bottom: 1px solid #3f3f46 !important;
        }
        .article-content td {
          padding: 14px 16px !important;
          border-bottom: 1px solid #27272a !important;
          color: #d4d4d8 !important;
          font-size: 0.95rem !important;
          line-height: 1.7 !important;
        }
        .article-content iframe {
          width: 100% !important;
          aspect-ratio: 16 / 9 !important;
          border-radius: 12px !important;
          border: 1px solid #27272a !important;
          margin: 2rem 0 !important;
        }
        .article-content img {
          width: 100% !important;
          border-radius: 12px !important;
          border: 1px solid #27272a !important;
          margin: 2rem 0 !important;
        }
      `}} />

      <SiteHeader categories={CATEGORIES} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 sm:px-8 py-8 sm:py-12">
        <nav className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors">HOME</Link>
          <span>/</span>
          <span className="text-blue-400 uppercase font-semibold">{categoryLabel}</span>
        </nav>

        <header className="mb-10 sm:mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] sm:text-xs font-mono font-semibold px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
              {categoryLabel}
            </span>
            <time className="text-[11px] sm:text-xs font-mono text-zinc-400">
              {new Date(article.publishedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })}
            </time>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-snug sm:leading-tight mb-8">
            {article.title}
          </h1>

          {article.eyecatch?.url && (
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 mb-8 sm:mb-10 shadow-xl shadow-black/50">
              <img src={`${article.eyecatch.url}?w=1200&fm=webp&q=85`} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          {aiSummary && (
            <div className="p-5 sm:p-7 rounded-2xl bg-[#0b132b] border border-blue-500/40 mb-10 sm:mb-12">
              <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold text-xs font-mono tracking-wider uppercase">
                <span className="text-base">✨</span>
                <span>AI Tactical Summary / 3行要約</span>
              </div>
              <div className="text-zinc-200 text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
                {aiSummary}
              </div>
            </div>
          )}
        </header>

        {/* 記事本文 */}
        <article className="article-content font-sans">
          {parse(article.body || "", articleParserOptions)}
        </article>

        {relatedArticles.length > 0 && (
          <section className="mt-16 sm:mt-24 pt-10 border-t border-zinc-800">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              こちらの戦術記事もおすすめ
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => (
                <Link key={rel.id} href={`/articles/${rel.slug}`} className="group block bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 hover:bg-zinc-900 transition duration-200">
                  <div className="aspect-video w-full overflow-hidden bg-zinc-800">
                    <img src={rel.eyecatch?.url ? `${rel.eyecatch.url}?w=500&fm=webp&q=80` : "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&auto=format&fit=crop&q=80"} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  </div>
                  <div className="p-3.5">
                    <h3 className="text-xs font-bold text-zinc-200 group-hover:text-blue-400 line-clamp-2 transition-colors">{rel.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 sm:mt-16 pt-8 border-t border-zinc-800 flex justify-between items-center">
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs sm:text-sm font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors">
            ← 記事一覧に戻る
          </Link>
        </div>
      </main>

      <SiteFooter categories={CATEGORIES} />
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
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

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;

  // microCMSから該当のスラッグを持つ記事を1件取得
  const data = await client.getList<Article>({
    endpoint: "articles",
    queries: {
      filters: `slug[equals]${slug}`,
      limit: 1,
    },
  });

  const article = data.contents[0];

  if (!article) {
    notFound();
  }

  const categoryLabel = Array.isArray(article.contentType)
    ? article.contentType[0]
    : article.contentType || "TACTICS";

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
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {/* 戻るボタン */}
        <div className="mt-14 pt-8 border-t border-zinc-800 flex justify-between items-center">
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

import { Suspense } from "react";
import Link from "next/link";
import { client, Article } from "@/lib/microcms";
import { CATEGORIES } from "@/lib/data/categories";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SearchBar } from "@/components/search-bar";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q || "";

  // microCMS の 全文検索クエリ（q）を使用
  let articles: Article[] = [];
  if (query.trim()) {
    try {
      const data = await client.getList<Article>({
        endpoint: "articles",
        queries: {
          q: query.trim(),
          orders: "-publishedAt",
        },
      });
      articles = data.contents;
    } catch (e) {
      articles = [];
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0f12] text-white flex flex-col font-sans">
      <SiteHeader categories={CATEGORIES} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* パンくずリスト */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors">
            HOME
          </Link>
          <span>/</span>
          <span className="text-blue-400 uppercase">SEARCH</span>
        </div>

        {/* 検索ヘッダー */}
        <div className="mb-10 pb-6 border-b border-zinc-800">
          <div className="inline-block text-xs font-mono font-semibold px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase mb-3">
            SEARCH RESULT
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-6">
            {query ? `「${query}」の検索結果` : "記事を検索"}
          </h1>
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>

        {/* 検索結果一覧 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs text-zinc-400 font-mono">
              {articles.length} ARTICLES FOUND
            </span>
          </div>

          {!query ? (
            <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800/80">
              <p className="text-zinc-400 text-sm">
                キーワードを入力して記事を検索してください。
              </p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800/80">
              <p className="text-zinc-400 text-sm">
                「{query}」に一致する記事は見つかりませんでした。
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-xs font-mono text-blue-400 hover:underline"
              >
                ← トップページに戻る
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => {
                const cardSummary =
                  (article as any).summary ||
                  article.body?.replace(/<[^>]*>?/gm, "") ||
                  "";

                return (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="group block bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all duration-200"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-zinc-800 relative">
                      <img
                        src={
                          article.eyecatch?.url
                            ? `${article.eyecatch.url}?w=800&fm=webp&q=80`
                            : "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80"
                        }
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                          {Array.isArray(article.contentType)
                            ? article.contentType[0]
                            : article.contentType || "TACTICS"}
                        </span>
                        <time className="text-xs text-zinc-400 font-mono">
                          {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
                        </time>
                      </div>
                      <h3 className="text-base font-bold text-zinc-100 group-hover:text-blue-400 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="mt-2 text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                        {cardSummary}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <SiteFooter categories={CATEGORIES} />
    </div>
  );
}
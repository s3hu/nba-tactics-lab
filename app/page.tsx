import { client, Article } from "@/lib/microcms";
import { CATEGORIES } from "@/lib/data/categories";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/components/hero-section";
import { CategoryTabs } from "@/components/category-tabs";

export const dynamic = "force-dynamic";

export default async function Home(){
  // microCMSから最新記事を取得
  const data = await client.getList<Article>({
    endpoint: "articles",
    queries: { orders: "-publishedAt" },
  });
  const articles = data.contents;

  // HeroSectionに渡す特集記事のフォーマット調整
  const firstArticle = articles[0];
  const featuredArticle = firstArticle
    ? ({
        id: firstArticle.id,
        title: firstArticle.title,
        slug: firstArticle.slug,
        summary: firstArticle.body.replace(/<[^>]*>?/gm, "").slice(0, 120) + "...",
        excerpt: firstArticle.body.replace(/<[^>]*>?/gm, "").slice(0, 120) + "...",
        content: firstArticle.body,
        category: Array.isArray(firstArticle.contentType)
          ? firstArticle.contentType[0]
          : firstArticle.contentType || "TACTICS",
        tags: [],
        thumbnailUrl:
          firstArticle.eyecatch?.url ||
          "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80",
        publishedAt: firstArticle.publishedAt,
      } as any)
    : null;

  return (
    <div className="min-h-screen bg-[#0d0f12] text-white flex flex-col font-sans">
      <SiteHeader categories={CATEGORIES} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {featuredArticle && <HeroSection article={featuredArticle} />}

        <div className="mt-12">
          <CategoryTabs categories={CATEGORIES} />
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              最新記事
            </h2>
            <span className="text-xs text-zinc-400 font-mono">
              {articles.length} ARTICLES
            </span>
          </div>

          {/* microCMSの記事一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <a
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
                        : article.contentType}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-zinc-100 group-hover:text-blue-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <div
                    className="mt-2 text-xs text-zinc-400 line-clamp-3 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: article.body }}
                  />
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter categories={CATEGORIES} />
    </div>
  );
}
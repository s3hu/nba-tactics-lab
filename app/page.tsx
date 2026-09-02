import { client, Article } from "@/lib/microcms";
import { CATEGORIES } from "@/lib/data/categories";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/components/hero-section";
import { CategoryTabs } from "@/components/category-tabs";
import { LoadMoreArticles } from "@/components/load-more-articles";

export const dynamic = "force-dynamic";

export default async function Home() {
  const articles = await client.getAllContents<Article>({
    endpoint: "articles",
    queries: { orders: "-publishedAt" },
  });

  const firstArticle = articles[0];
  const featuredArticle = firstArticle
    ? ({
        id: firstArticle.id,
        title: firstArticle.title,
        slug: firstArticle.slug,
        summary:
          (firstArticle as Article & { summary?: string }).summary ||
          `${firstArticle.body?.replace(/<[^>]*>?/gm, "").slice(0, 120)}...`,
        excerpt:
          (firstArticle as Article & { summary?: string }).summary ||
          `${firstArticle.body?.replace(/<[^>]*>?/gm, "").slice(0, 120)}...`,
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

          <LoadMoreArticles articles={articles} />
        </section>
      </main>

      <SiteFooter categories={CATEGORIES} />
    </div>
  );
}

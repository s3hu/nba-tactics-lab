import type { Article, Category } from "@/lib/types";
import { ArticleCard } from "@/components/article-card";

type ArticleGridProps = {
  articles: Article[];
  categories: Category[];
  emptyMessage?: string;
};

export function ArticleGrid({ articles, categories, emptyMessage }: ArticleGridProps) {
  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 py-16 text-center">
        <p className="text-sm text-slate-500">
          {emptyMessage ?? "条件に合う記事が見つかりませんでした。"}
        </p>
      </div>
    );
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard
          key={article.slug}
          article={article}
          category={categoryMap.get(article.categoryId)}
        />
      ))}
    </div>
  );
}

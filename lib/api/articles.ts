import { ARTICLES } from "@/lib/data/articles";
import type { Article, ArticleQuery } from "@/lib/types";

/**
 * 記事データへのアクセスを一元化する層。
 *
 * UIコンポーネント（page.tsx やカードコンポーネント）は、
 * 「lib/data/articles.ts の配列」に直接触れることを想定していない。
 * 必ずこのファイルがエクスポートする関数を経由してデータを取得する。
 *
 * これにより、データソースを
 *   ローカル配列 → microCMS → Notion API → MDXファイル
 * のどれに差し替える場合も、書き換えが必要なのはこのファイルのみになる。
 *
 * ---- 差し替え例（microCMSの場合のイメージ） ----
 * export async function getAllArticles(params?: ArticleQuery) {
 *   const res = await fetch(`${process.env.MICROCMS_ENDPOINT}/articles`, {
 *     headers: { "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY! },
 *     next: { revalidate: 60 },
 *   });
 *   const { contents } = await res.json();
 *   return contents.map(mapMicroCmsResponseToArticle).filter(...);
 * }
 * -------------------------------------------------
 *
 * 現時点ではローカル配列を同期的に返しているが、将来のfetch呼び出しに
 * 備えて全関数を async にしてある。
 */

function matchesQuery(article: Article, params?: ArticleQuery): boolean {
  if (!params) return true;

  if (params.categoryId && article.categoryId !== params.categoryId) {
    return false;
  }

  if (params.tag && !article.tags.includes(params.tag)) {
    return false;
  }

  if (params.query) {
    const keyword = params.query.trim().toLowerCase();
    if (keyword.length > 0) {
      const haystack = `${article.title} ${article.excerpt}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
  }

  return true;
}

/** 公開日の新しい順にソートする */
function sortByPublishedDateDesc(articles: Article[]): Article[] {
  return [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** 条件に合致する記事一覧を取得する */
export async function getAllArticles(params?: ArticleQuery): Promise<Article[]> {
  const filtered = ARTICLES.filter((a) => matchesQuery(a, params));
  const sorted = sortByPublishedDateDesc(filtered);
  return typeof params?.limit === "number" ? sorted.slice(0, params.limit) : sorted;
}

/** ヒーローエリアに表示するおすすめ記事を1件取得する（featuredフラグ優先、なければ最新記事） */
export async function getFeaturedArticle(): Promise<Article | null> {
  const featured = ARTICLES.find((a) => a.featured);
  if (featured) return featured;
  const [latest] = sortByPublishedDateDesc(ARTICLES);
  return latest ?? null;
}

/** スラッグから記事を1件取得する */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  return ARTICLES.find((a) => a.slug === slug) ?? null;
}

/** 静的生成（generateStaticParams）用に全スラッグを取得する */
export async function getAllArticleSlugs(): Promise<string[]> {
  return ARTICLES.map((a) => a.slug);
}

/** 同カテゴリーの関連記事を取得する（自分自身は除外） */
export async function getRelatedArticles(article: Article, limit = 3): Promise<Article[]> {
  const sameCategory = ARTICLES.filter(
    (a) => a.slug !== article.slug && a.categoryId === article.categoryId
  );
  return sortByPublishedDateDesc(sameCategory).slice(0, limit);
}

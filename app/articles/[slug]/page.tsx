import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CATEGORIES, getCategoryById } from "@/lib/data/categories";
import {
  getAllArticleSlugs,
  getArticleBySlug,
  getRelatedArticles,
} from "@/lib/api/articles";
import { formatDate } from "@/lib/utils/format-date";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArticleContent } from "@/components/article-content";
import { ArticleGrid } from "@/components/article-grid";

type ArticlePageProps = {
  // Next.js 15以降ではparamsもPromiseになるため、
  // `params: Promise<{ slug: string }>` + `await params` に読み替える。
  params: {
    slug: string;
  };
};

/** ビルド時に全記事ページを静的生成するためのスラッグ一覧 */
export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return { title: "記事が見つかりません | NBA TACTICS LAB" };

  return {
    title: `${article.title} | NBA TACTICS LAB`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.thumbnailUrl],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

  const category = getCategoryById(article.categoryId);
  const related = await getRelatedArticles(article);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SiteHeader categories={CATEGORIES} />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 font-mono text-sm text-slate-400 hover:text-orange-400"
        >
          <ArrowLeft className="h-4 w-4" /> 記事一覧へ戻る
        </Link>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          {category && (
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
              {category.label}
            </span>
          )}
          <time dateTime={article.publishedAt} className="text-xs text-slate-500">
            {formatDate(article.publishedAt)}
          </time>
        </div>

        <h1 className="mb-6 text-2xl font-bold leading-tight text-slate-50 md:text-4xl">
          {article.title}
        </h1>

        <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-2xl border border-slate-800">
          <Image
            src={article.thumbnailUrl}
            alt={article.title}
            fill
            priority
            className="object-cover"
          />
        </div>

        <ArticleContent blocks={article.content} />

        <div className="mt-10 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-500"
            >
              #{tag}
            </span>
          ))}
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-5 text-lg font-semibold text-slate-200">関連記事</h2>
            <ArticleGrid articles={related} categories={CATEGORIES} />
          </div>
        )}
      </main>

      <SiteFooter categories={CATEGORIES} />
    </div>
  );
}

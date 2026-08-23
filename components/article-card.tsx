import Image from "next/image";
import Link from "next/link";
import type { Article, Category } from "@/lib/types";
import { formatDate } from "@/lib/utils/format-date";

type ArticleCardProps = {
  article: Article;
  category?: Category;
};

/**
 * 記事1件分の表示だけを担当する、状態を持たない純粋なUIコンポーネント。
 * データの取得方法（ローカル配列かCMSか）を一切知らないため、
 * Article型を満たすオブジェクトであればどこから来ても描画できる。
 *
 * 画像は next/image を使用。外部ドメインの画像を読み込む場合は
 * next.config.ts の images.remotePatterns にドメインを追加すること。
 */
export function ArticleCard({ article, category }: ArticleCardProps) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 transition-all duration-300 hover:border-orange-500/50 hover:bg-slate-900"
    >
      <div className="relative h-40 w-full border-b border-slate-800 bg-slate-800">
        <Image
          src={article.thumbnailUrl}
          alt={article.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        {category && (
          <span className="absolute left-3 top-3 rounded border border-orange-500/30 bg-slate-950/80 px-2 py-1 text-[10px] font-medium tracking-wide text-orange-300">
            {category.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <time dateTime={article.publishedAt} className="text-xs text-slate-500">
          {formatDate(article.publishedAt)}
        </time>
        <h3 className="text-base font-semibold leading-snug text-slate-100 group-hover:text-orange-400">
          {article.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-400">{article.excerpt}</p>
      </div>
    </Link>
  );
}

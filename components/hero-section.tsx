import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Article, Category } from "@/lib/types";

type HeroSectionProps = {
  article: Article;
  category?: Category;
};

export function HeroSection({ article, category }: HeroSectionProps) {
  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="relative grid gap-6 md:grid-cols-2">
        <div className="relative h-56 md:h-full">
          <Image
            src={article.thumbnailUrl}
            alt={article.title}
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-medium tracking-widest text-orange-400">
              FEATURED
            </span>
            {category && (
              <span className="rounded-full border border-slate-700 px-3 py-1 text-[10px] text-slate-400">
                {category.label}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold leading-tight text-slate-50 md:text-3xl">
            {article.title}
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-slate-400 md:text-base">
            {article.excerpt}
          </p>

          <Link
            href={`/articles/${article.slug}`}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-400"
          >
            記事を読む <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

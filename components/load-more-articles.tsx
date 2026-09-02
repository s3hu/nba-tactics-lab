"use client";

import { useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/microcms";

const PAGE_SIZE = 9;

export function LoadMoreArticles({ articles }: { articles: Article[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const hasMore = visibleCount < articles.length;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.slice(0, visibleCount).map((article) => {
          const cardSummary =
            (article as Article & { summary?: string }).summary ||
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
                  src={article.eyecatch?.url
                    ? `${article.eyecatch.url}?w=800&fm=webp&q=80`
                    : "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80"}
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

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-6 py-3 text-sm font-bold text-blue-400 transition-colors hover:bg-blue-500/20 hover:text-blue-300"
          >
            もっと見る
          </button>
        </div>
      )}
    </>
  );
}

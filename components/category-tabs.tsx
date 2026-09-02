import Link from "next/link";
import type { Category } from "@/lib/types";

type CategoryTabsProps = {
  categories: Category[];
  activeCategoryId?: string;
  /** カテゴリー切り替え時に検索キーワードを保持したい場合に渡す */
  currentQuery?: string;
};

/**
 * カテゴリーは配列を受け取って描画するだけなので、
 * lib/data/categories.ts を編集すればタブの数は自動で増減する。
 * サーバーコンポーネントのままで動作する（クライアント状態を持たない）。
 */
export function CategoryTabs({ categories, activeCategoryId, currentQuery }: CategoryTabsProps) {
  function buildHref(categoryId?: string) {
    if (!categoryId) return currentQuery ? `/?q=${encodeURIComponent(currentQuery)}` : "/";
    const category = categories.find((item) => item.id === categoryId);
    return `/categories/${category?.slug || categoryId}`;
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <Link
        href={buildHref(undefined)}
        className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
          !activeCategoryId
            ? "border-orange-500 bg-orange-500 text-slate-950 font-medium"
            : "border-slate-700 bg-slate-900 text-slate-400 hover:border-orange-500/60 hover:text-orange-400"
        }`}
      >
        すべて
      </Link>
      {categories.map((category) => {
        const isActive = category.id === activeCategoryId;
        return (
          <Link
            key={category.id}
            href={buildHref(category.id)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
              isActive
                ? "border-orange-500 bg-orange-500 text-slate-950 font-medium"
                : "border-slate-700 bg-slate-900 text-slate-400 hover:border-orange-500/60 hover:text-orange-400"
            }`}
          >
            {category.label}
          </Link>
        );
      })}
    </div>
  );
}

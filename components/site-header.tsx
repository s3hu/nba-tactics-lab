"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X, Target } from "lucide-react";
import type { Category } from "@/lib/types";
import { SearchBar } from "@/components/search-bar";

type SiteHeaderProps = {
  categories: Category[];
};

/**
 * カテゴリーはpropsとして受け取るだけで、ここには一切ハードコードしない。
 * lib/data/categories.ts の配列を増減させれば、このヘッダーのナビゲーションも
 * 自動的に増減する。
 */
export function SiteHeader({ categories }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategoryId = searchParams.get("category");

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold text-slate-50">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500 text-slate-950">
            <Target className="h-4.5 w-4.5" strokeWidth={2.5} />
          </span>
          NBA TACTICS LAB
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {categories.map((category) => {
            const isActive = pathname === "/" && activeCategoryId === category.id;
            return (
              <Link
                key={category.id}
                href={`/?category=${category.id}`}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-orange-500/10 text-orange-400"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {category.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block">
          <SearchBar />
        </div>

        <button
          type="button"
          aria-label="メニューを開く"
          className="text-slate-300 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-800 px-4 py-4 md:hidden">
          <div className="mb-4">
            <SearchBar onNavigate={() => setMobileOpen(false)} />
          </div>
          <nav className="flex flex-col gap-1">
            {categories.map((category) => {
              const isActive = pathname === "/" && activeCategoryId === category.id;
              return (
                <Link
                  key={category.id}
                  href={`/?category=${category.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-orange-500/10 text-orange-400"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {category.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

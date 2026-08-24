"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Category } from "@/types";
import { SearchBar } from "./search-bar";

interface SiteHeaderProps {
  categories: Category[];
}

export function SiteHeader({ categories }: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-800 bg-[#0d0f12]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* サイトロゴ */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-mono">
              NBA <span className="text-blue-500">TACTICS</span> LAB
            </span>
          </Link>

          {/* 検索バー（PC・タブレット表示） */}
          <div className="hidden md:block flex-1 max-w-xs lg:max-w-sm mx-4">
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
          </div>

          {/* カテゴリーナビゲーション */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
            {categories.map((category) => {
              const href = `/categories/${category.slug || category.id}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={category.id}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                  }`}
                >
                  {category.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* モバイル用検索バー（画面幅が狭い場合） */}
        <div className="pb-3 md:hidden">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
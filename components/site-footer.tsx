import Link from "next/link";
import type { Category } from "@/lib/types";

type SiteFooterProps = {
  categories: Category[];
};

export function SiteFooter({ categories }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-800">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-slate-100">NBA TACTICS LAB</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
            NBAの戦術・ニュース・コラムを発信するメディアです。試合の見方が一段深くなる情報をお届けします。
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-300">カテゴリー</p>
          <ul className="mt-3 flex flex-col gap-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/?category=${category.id}`}
                  className="text-sm text-slate-500 hover:text-orange-400"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-300">サイト情報</p>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <Link href="/terms" className="text-sm text-slate-500 hover:text-orange-400">
                利用規約
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-sm text-slate-500 hover:text-orange-400">
                プライバシーポリシー
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-sm text-slate-500 hover:text-orange-400">
                このサイトについて
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        &copy; {year} NBA TACTICS LAB. All rights reserved.
      </div>
    </footer>
  );
}

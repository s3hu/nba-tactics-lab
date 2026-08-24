import Link from "next/link";

interface SiteFooterProps {
  categories?: { id: string; label: string; slug?: string }[];
}

export function SiteFooter({ categories = [] }: SiteFooterProps) {
  return (
    <footer className="border-t border-zinc-800 bg-[#0d0f12] text-zinc-400 text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <span className="font-extrabold text-base tracking-tight text-white font-mono">
              NBA <span className="text-blue-500">TACTICS</span> LAB
            </span>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
              NBAの戦術・ニュース・コラムを発信するメディアです。試合の見方が一段深くなる情報をお届けします。
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3 font-mono text-xs uppercase tracking-wider">
              カテゴリー
            </h3>
            <ul className="space-y-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/categories/${c.slug || c.id}`}
                    className="hover:text-white transition-colors"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3 font-mono text-xs uppercase tracking-wider">
              サイト情報
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  このサイトについて
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-800/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-zinc-500">
          <p>© 2026 NBA TACTICS LAB. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
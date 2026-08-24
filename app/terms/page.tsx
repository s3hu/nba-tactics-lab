import Link from "next/link";
import { CATEGORIES } from "@/lib/data/categories";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0d0f12] text-white flex flex-col font-sans">
      <SiteHeader categories={CATEGORIES} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors">
            HOME
          </Link>
          <span>/</span>
          <span className="text-blue-400 uppercase">TERMS</span>
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-8 pb-4 border-b border-zinc-800">
          利用規約
        </h1>

        <div className="prose prose-invert max-w-none text-zinc-300 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. はじめに</h2>
            <p>
              本利用規約は、「NBA TACTICS LAB」（以下、「当サイト」）が提供するすべてのコンテンツおよびサービスの利用条件を定めるものです。利用者の皆様には、本規約に同意した上で当サイトをご利用いただきます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. 著作権・知的財産権</h2>
            <p>
              当サイトに掲載されている文章、画像、戦術分析データ等のコンテンツの著作権は、当サイトまたは正当な権利者に帰属します。無断転載・無断引用・複製を禁止します。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. 免責事項</h2>
            <p>
              当サイトに掲載されている情報については、可能な限り正確性を保つよう努めておりますが、正確性や安全性を保証するものではありません。当サイトの情報を利用することによって生じた損害等について、当サイトは一切の責任を負いかねます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. 規約の変更</h2>
            <p>
              当サイトは、必要と判断した場合には利用者に予告なく本規約を変更できるものとします。
            </p>
          </section>
        </div>
      </main>

      <SiteFooter categories={CATEGORIES} />
    </div>
  );
}
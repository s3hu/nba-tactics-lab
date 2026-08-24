import Link from "next/link";
import { CATEGORIES } from "@/lib/data/categories";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0d0f12] text-white flex flex-col font-sans">
      <SiteHeader categories={CATEGORIES} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors">
            HOME
          </Link>
          <span>/</span>
          <span className="text-blue-400 uppercase">PRIVACY POLICY</span>
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-8 pb-4 border-b border-zinc-800">
          プライバシーポリシー
        </h1>

        <div className="prose prose-invert max-w-none text-zinc-300 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. 個人情報の収集・利用目的</h2>
            <p>
              当サイトでは、お問い合わせやアクセス解析の際に、名前（ハンドルネーム）やメールアドレス、Cookie等の情報を収集する場合があります。これらの情報は、お問い合わせへの回答やサイトの利便性向上のみに利用いたします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. アクセス解析ツールについて</h2>
            <p>
              当サイトでは、サイトの利用状況を把握するためにアクセス解析ツールを利用することがあります。トラフィックデータの収集のためにCookieが使用されますが、データは匿名で収集されており個人を特定するものではありません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. 個人情報の第三者開示</h2>
            <p>
              法令に基づく開示要請があった場合を除き、取得した個人情報を本人の同意なく第三者に開示・提供することはありません。
            </p>
          </section>
        </div>
      </main>

      <SiteFooter categories={CATEGORIES} />
    </div>
  );
}
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0d0f12] text-white flex flex-col font-sans">
      <header className="border-b border-zinc-800 bg-[#0d0f12]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-mono">
            NBA <span className="text-blue-500">TACTICS</span> LAB
          </Link>
          <Link href="/" className="text-xs font-mono text-zinc-400 hover:text-white transition">
            ← TOPに戻る
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors">HOME</Link>
          <span>/</span>
          <span className="text-blue-400 uppercase">ABOUT US</span>
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-8 pb-4 border-b border-zinc-800">
          このサイトについて
        </h1>

        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">NBA TACTICS LAB とは</h2>
            <p>NBA TACTICS LAB は、NBAの試合戦術、セットオフェンス、ディフェンススキーム、選手のスタッツや特徴を深く掘り下げて解説する専門メディアです。</p>
            <p className="mt-2">「試合観戦が一段深くなる」をコンセプトに、ハイライトを見るだけでは分からない戦術の意図やチームごとのシステムを分かりやすくお届けします。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">主なコンテンツ</h2>
            <ul className="list-disc list-inside space-y-2 text-zinc-400">
              <li><strong className="text-zinc-200">戦術解説（TACTICS）:</strong> ピック＆ロール、アイソレーション、ゾーンディフェンス等の徹底分解</li>
              <li><strong className="text-zinc-200">チーム別解説:</strong> 各チームのオフェンスレーティングやプレースタイルの分析</li>
              <li><strong className="text-zinc-200">コラム・ニュース:</strong> トレンド戦術や注目選手の深掘り記事</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800">
          <Link href="/" className="inline-flex items-center text-xs font-mono text-blue-400 hover:underline">
            ← トップページに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
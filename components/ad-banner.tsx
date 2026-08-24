interface AdBannerProps {
  type?: "affiliate" | "adsense";
  title?: string;
  description?: string;
  linkUrl?: string;
  buttonText?: string;
  imageUrl?: string;
}

export function AdBanner({
  type = "affiliate",
  title = "NBAの試合をライブ＆見逃し配信でチェック",
  description = "全試合の高画質ライブ配信、ハイライト、スタッツ分析などNBAを楽しむための必須サービスをチェックしよう。",
  linkUrl = "#",
  buttonText = "詳しく見る",
  imageUrl = "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80",
}: AdBannerProps) {
  return (
    <div className="my-10 p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden relative">
      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded absolute top-3 right-3">
        PR / スポンサー
      </span>

      <div className="flex flex-col sm:flex-row items-center gap-6 mt-2">
        <div className="w-full sm:w-36 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-zinc-800 shrink-0">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-base font-bold text-white mb-2 leading-snug">
            {title}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            {description}
          </p>
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wide transition-colors shadow-lg shadow-blue-600/20"
          >
            {buttonText} →
          </a>
        </div>
      </div>
    </div>
  );
}
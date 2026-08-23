import type { Article } from "@/lib/types";

/**
 * 記事データのモック実装。
 *
 * 本番運用では、この配列をそのまま置き換えるのではなく、
 * lib/api/articles.ts 側の実装だけを差し替えて
 * microCMS / Notion API / MDXファイル読み込み等から
 * 同じ Article[] 型を返すようにするのが移行の基本方針。
 *
 * つまりこのファイルは「開発用のシードデータ」という位置づけであり、
 * コンポーネント側から直接 import されることは想定しない
 * （必ず lib/api/articles.ts の関数経由でアクセスする）。
 */
export const ARTICLES: Article[] = [
  {
    slug: "spain-pnr-doncic",
    title:
      "ダラス・マーベリックスの代名詞：ルカ・ドンチッチを活かす『スペインPick & Roll』の完全解体",
    excerpt:
      "ただのピック&ロールがなぜ“止められない”武器に変わるのか。3人目の選手が仕掛ける裏スクリーンの意図と、ドロップカバレッジを崩壊させる連鎖反応をステップごとに解剖する。",
    publishedAt: "2026-08-01",
    thumbnailUrl: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1200&q=80",
    categoryId: "tactics",
    tags: ["スペインPnR", "PNR", "ドロップ対策"],
    featured: true,
    author: { name: "編集部" },
    content: [
      { type: "heading", level: 2, text: "1. はじめに" },
      {
        type: "paragraph",
        text: "ルカ・ドンチッチというプレーヤーを一言で表すなら「一人でオフェンスを完結させられる稀有な創造者」だろう。しかし、相手がドロップカバレッジを敷いてくれば単純なピック&ロールだけでは徐々に手詰まりになる。そこでマーベリックスが多用してきたのが3人構成のアクション「スペインPick & Roll」である。",
      },
      { type: "heading", level: 2, text: "2. 基本構造と狙い" },
      {
        type: "paragraph",
        text: "骨格はシンプルで、ボールハンドラー、スクリーナー、そしてスクリーナーの守備者に背screenを当てる第3の選手の3人で成立する。狙いはスクリーナーを守る相手の視界と足を同時に奪うことにある。",
      },
      { type: "heading", level: 2, text: "3. ステップ別：具体的な動きの展開" },
      {
        type: "list",
        items: [
          "Step 1: サイドで通常のオン・ボール・スクリーンを設定し、守備側はドロップで構える。",
          "Step 2: コーナーの選手が走り込み、スクリーナーの守備者に気づかれない背screenを当てる。",
          "Step 3: スクリーナーが広大なスペースへロール。ロブかキックアウトの二択が生まれる。",
        ],
      },
      { type: "heading", level: 2, text: "4. なぜ守れないのか？ディフェンスのジレンマ" },
      {
        type: "paragraph",
        text: "守備は個人のミスではなく構造的なジレンマに直面する。背screenを受けた側はルートを断たれ、ヘルプに向かえば別の選手がノーマークになる。",
      },
      { type: "heading", level: 2, text: "5. 実際の試合での活用例・見どころ" },
      {
        type: "paragraph",
        text: "第4クォーター終盤、相手がスカウティング通りにドロップを固めてくる場面でこそ効果を発揮する。ドンチッチがどこまで“溜めて”からパスを離すかが観戦のポイントだ。",
      },
      { type: "heading", level: 2, text: "6. まとめ" },
      {
        type: "list",
        items: [
          "スペインPnRの本質は「スクリーナーの守備者」を狙う3人目の存在にある。",
          "ドロップカバレッジそのものを弱点に変換する。",
          "個人のミスに依存しないため繰り返し使っても機能しやすい。",
        ],
      },
    ],
  },
  {
    slug: "horns-jokic",
    title: "なぜ止まらない？ニコラ・ヨキッチが操る『ホーンズオフェンス』の設計図",
    excerpt:
      "両エルボーにビッグマンを配置する「ホーンズ」フォーメーション。パッシングセンターの視野を最大化する配置の意味を読み解く。",
    publishedAt: "2026-07-24",
    thumbnailUrl: "https://images.unsplash.com/photo-1518614368389-3f6ecb14d423?w=1200&q=80",
    categoryId: "tactics",
    tags: ["ホーンズ", "エルボータッチ"],
    author: { name: "編集部" },
    content: [
      { type: "heading", level: 2, text: "1. はじめに" },
      { type: "paragraph", text: "準備中の記事です。" },
    ],
  },
  {
    slug: "celtics-offseason-report",
    title: "セルティックス、オフシーズンの補強を採点する",
    excerpt: "ロースター全体のバランスを見ながら、今夏の動きが来季にどう響くかを整理する。",
    publishedAt: "2026-08-10",
    thumbnailUrl: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=1200&q=80",
    categoryId: "team",
    tags: ["セルティックス", "オフシーズン"],
    author: { name: "編集部" },
    content: [
      { type: "heading", level: 2, text: "1. はじめに" },
      { type: "paragraph", text: "準備中の記事です。" },
    ],
  },
  {
    slug: "trade-deadline-news",
    title: "トレード期限まで1週間、噂されている主要3件を整理",
    excerpt: "各球団のフロントが検討していると報じられている交渉材料を、現時点の情報でまとめる。",
    publishedAt: "2026-08-15",
    thumbnailUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80",
    categoryId: "news",
    tags: ["トレード", "移籍"],
    author: { name: "編集部" },
    content: [
      { type: "heading", level: 2, text: "1. はじめに" },
      { type: "paragraph", text: "準備中の記事です。" },
    ],
  },
  {
    slug: "buzzer-beater-column",
    title: "ブザービーターが生まれる0.4秒に何が起きているのか",
    excerpt: "土壇場の一本を生む選手心理とチームの準備を、過去の名場面とともに振り返るコラム。",
    publishedAt: "2026-07-30",
    thumbnailUrl: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=1200&q=80",
    categoryId: "column",
    tags: ["ブザービーター", "名場面"],
    author: { name: "編集部" },
    content: [
      { type: "heading", level: 2, text: "1. はじめに" },
      { type: "paragraph", text: "準備中の記事です。" },
    ],
  },
  {
    slug: "top10-dunks-week",
    title: "今週のトップ10ダンクを振り返る",
    excerpt: "週間ハイライトから見応えのあるプレーだけを厳選してカウントダウン形式で紹介。",
    publishedAt: "2026-08-18",
    thumbnailUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80",
    categoryId: "highlight",
    tags: ["ハイライト", "ダンク"],
    author: { name: "編集部" },
    content: [
      { type: "heading", level: 2, text: "1. はじめに" },
      { type: "paragraph", text: "準備中の記事です。" },
    ],
  },
];

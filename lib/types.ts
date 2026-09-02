/**
 * ドメイン全体で共有する型定義。
 *
 * ここを「唯一の正」とし、コンポーネント側は必ずこの型を import して使う。
 * 将来 microCMS / Notion API / MDX などデータソースを差し替える際も、
 * 取得したデータをこの型に変換（マッピング）しさえすれば
 * UI コンポーネント側は一切変更不要になる。
 */

/** カテゴリー定義。固定の enum ではなく配列データとして管理し、増減を容易にする */
export type Category = {
  /** URLやフィルタ処理で使う一意なID（例: "tactics"） */
  id: string;
  /** 画面表示用ラベル（例: "戦術解説"） */
  label: string;
  /** カテゴリー一覧ページなどで使うslug（基本はidと同じでよい） */
  slug: string;
  /** microCMSのcontentTypeに保存される値（例: "TACTICS"） */
  cmsValue?: string;
  /** 一覧ページの説明文などに使う任意の補足 */
  description?: string;
};

/** 本文を構成する最小単位。Markdown/MDXへの移行を見据えたブロック構造 */
export type ContentBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; src: string; alt: string; caption?: string };

/** 執筆者情報（任意） */
export type Author = {
  name: string;
  avatarUrl?: string;
};

/** 記事データの型。CMS移行時はこの型に合わせてレスポンスをマッピングする */
export type Article = {
  /** URLに使う一意なスラッグ（例: "spain-pnr-doncic"） */
  slug: string;
  title: string;
  /** 一覧カードや検索結果に出す要約 */
  excerpt: string;
  /** ISO 8601形式の公開日（例: "2026-08-01"） */
  publishedAt: string;
  updatedAt?: string;
  /** サムネイル画像URL（外部CDN/CMSの絶対URLを想定） */
  thumbnailUrl: string;
  /** Category['id'] と対応 */
  categoryId: string;
  /** フリーワードタグ。フィルタ・関連記事表示に利用 */
  tags: string[];
  /** ヒーローエリアに出す「おすすめ記事」フラグ */
  featured?: boolean;
  author?: Author;
  /** 記事本文（ブロック配列） */
  content: ContentBlock[];
  /** AI生成されたSEO向けタイトル */
  seoTitle?: string;
  /** AI生成された要約文 */
  summary?: string;
};

/** 記事一覧取得時の絞り込み条件 */
export type ArticleQuery = {
  categoryId?: string;
  tag?: string;
  /** タイトル・要約に対する部分一致検索キーワード */
  query?: string;
  /** 取得件数の上限 */
  limit?: number;
};

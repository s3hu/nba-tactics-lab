# 導入メモ

## 1. ファイルの配置

このZIP/フォルダの中身を、既存プロジェクトの同じパスにそのまま上書き・追加してください。

```
lib/types.ts
lib/data/categories.ts
lib/data/articles.ts
lib/api/articles.ts
lib/utils/format-date.ts
components/site-header.tsx
components/search-bar.tsx
components/category-tabs.tsx
components/article-card.tsx
components/article-grid.tsx
components/hero-section.tsx
components/article-content.tsx
components/site-footer.tsx
app/page.tsx
app/articles/[slug]/page.tsx
```

`@/` エイリアスを使っているので、`tsconfig.json` に以下がない場合は追加してください（`create-next-app` のデフォルトなら既に入っています）。

```jsonc
{
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  }
}
```

## 2. next.config.ts / next.config.js に画像ドメインを追加

サンプルデータでは Unsplash の画像URLを使っています。`next/image` は許可したドメインしか
読み込まないため、以下のように設定してください（実運用ではCMSの画像ドメインに置き換え）。

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // microCMSなど本番の画像配信ドメインをここに追加
    ],
  },
};

export default nextConfig;
```

## 3. Next.js 15 系を使っている場合の注意

Next.js 15 以降では `page.tsx` の `searchParams` / `params` が **Promise** になっています。
その場合、`app/page.tsx` と `app/articles/[slug]/page.tsx` を以下のように書き換えてください。

```tsx
type HomePageProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { category, q } = await searchParams;
  // ...
}
```

```tsx
type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  // ...
}
```

## 4. `/terms` `/privacy` `/about` について

フッターはこれらのページへのリンク枠のみ用意しています。実ページ（`app/terms/page.tsx` など）は
必要に応じて追加してください。

## 5. 今後CMSに接続する場合

書き換えが必要なのは `lib/api/articles.ts` の関数の中身だけです。UIコンポーネント（`components/*`）や
ページ（`app/page.tsx` / `app/articles/[slug]/page.tsx`）は `Article` / `Category` 型を
満たすデータである限り変更不要です。

- **microCMS**: `fetch` でAPIを叩き、レスポンスを `Article[]` にマッピングする
- **Notion API**: データベースのページ一覧を取得し、プロパティを `Article` にマッピングする
- **MDX**: `content` フィールドをブロック配列ではなく生のMarkdown文字列にし、
  `components/article-content.tsx` を `next-mdx-remote` 等でレンダリングするコンポーネントに差し替える

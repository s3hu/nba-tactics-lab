import { createClient } from "microcms-js-sdk";

if (!process.env.MICROCMS_SERVICE_DOMAIN) {
  throw new Error("MICROCMS_SERVICE_DOMAIN is required");
}

if (!process.env.MICROCMS_API_KEY) {
  throw new Error("MICROCMS_API_KEY is required");
}

export const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: process.env.MICROCMS_API_KEY,
});

// 記事データの型定義
export type Article = {
  id: string;
  title: string;
  slug: string;
  contentType: string[];
  body: string;
  eyecatch?: {
    url: string;
    height: number;
    width: number;
  };
  tacticsBoardData?: string;
  sourceUrls?: string;
  publishedAt: string;
};
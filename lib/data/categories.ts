import type { Category } from "@/lib/types";

/**
 * サイトのカテゴリー一覧。
 * 「オフェンス/ディフェンス」のような固定カテゴリーに縛られず、
 * ここに配列を追加・削除するだけでナビゲーション/タブ/バッジが
 * 全て自動的に増減するようにしてある。
 *
 * 将来 CMS 管理にする場合は、この配列をCMSから取得した
 * カテゴリーマスタに置き換えるだけでよい。
 */
export const CATEGORIES: Category[] = [
  {
    id: "news",
    label: "ニュース",
    slug: "news",
    description: "移籍・怪我情報・試合結果など速報性の高いトピック",
  },
  {
    id: "column",
    label: "コラム",
    slug: "column",
    description: "選手やチームを独自の切り口で語る読み物",
  },
  {
    id: "tactics",
    label: "戦術解説",
    slug: "tactics",
    description: "セットプレーやディフェンス戦術をロジカルに分解する記事",
  },
  {
    id: "team",
    label: "チーム別解説",
    slug: "team",
    description: "特定チームの編成・戦力を深掘りする記事",
  },
  {
    id: "highlight",
    label: "ハイライト",
    slug: "highlight",
    description: "試合のハイライトプレーや名場面を振り返る記事",
  },
];

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";

type SearchBarProps = {
  onNavigate?: () => void;
};

/**
 * トップページの記事一覧を絞り込むための検索バー。
 * 送信するとURLの ?q= パラメータを更新するだけなので、
 * 実際のフィルタリングロジックは app/page.tsx（サーバー側）に閉じている。
 */
export function SearchBar({ onNavigate }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    router.push(`/?${params.toString()}`);
    onNavigate?.();
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="記事を検索"
        aria-label="記事を検索"
        className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
      />
    </form>
  );
}

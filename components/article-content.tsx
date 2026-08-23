import Image from "next/image";
import type { ContentBlock } from "@/lib/types";

type ArticleContentProps = {
  blocks: ContentBlock[];
};

/**
 * Article.content（ブロック配列）をHTMLに変換して描画する。
 *
 * 将来MDXに移行する場合は、このコンポーネントの代わりに
 * `<MDXRemote source={article.body} />` 等を差し込むだけでよく、
 * ページ側（app/articles/[slug]/page.tsx）は変更不要になるよう
 * 表示ロジックをここに閉じ込めてある。
 */
export function ArticleContent({ blocks }: ArticleContentProps) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading": {
            const Tag = block.level === 3 ? "h3" : "h2";
            return (
              <Tag
                key={index}
                className="mt-4 text-xl font-bold text-slate-100 first:mt-0 md:text-2xl"
              >
                {block.text}
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={index} className="text-base leading-loose text-slate-300">
                {block.text}
              </p>
            );
          case "list":
            return (
              <ul key={index} className="flex flex-col gap-2 pl-1">
                {block.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm leading-relaxed text-slate-300"
                  >
                    <span className="font-mono text-orange-500">
                      {String(itemIndex + 1).padStart(2, "0")}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            );
          case "image":
            return (
              <figure key={index} className="flex flex-col gap-2">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800">
                  <Image src={block.src} alt={block.alt} fill className="object-cover" />
                </div>
                {block.caption && (
                  <figcaption className="text-center text-xs text-slate-500">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

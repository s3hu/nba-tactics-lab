import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Props = {
  params: Promise<{ slug: string }>;
};

// microCMS から記事詳細を取得
async function getArticle(slug: string) {
  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY;

  if (!serviceDomain || !apiKey) return null;

  try {
    // 1. スラッグで検索
    const filterRes = await fetch(
      `https://${serviceDomain}.microcms.io/api/v1/articles?filters=slug[equals]${slug}`,
      {
        headers: { "X-MICROCMS-API-KEY": apiKey },
        next: { revalidate: 0 },
      }
    );

    if (filterRes.ok) {
      const filterData = await filterRes.json();
      if (filterData.contents && filterData.contents.length > 0) {
        return filterData.contents[0];
      }
    }

    // 2. IDで直接取得
    const directRes = await fetch(
      `https://${serviceDomain}.microcms.io/api/v1/articles/${slug}`,
      {
        headers: { "X-MICROCMS-API-KEY": apiKey },
        next: { revalidate: 0 },
      }
    );

    if (directRes.ok) {
      return await directRes.json();
    }

    return null;
  } catch (error) {
    return null;
  }
}

// SEOメタデータの生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) return { title: "Not Found" };

  const seoTitle = article.seoTitle || article.title;
  const description =
    article.summary || article.description || `${article.title}の解説記事です。`;

  return {
    title: seoTitle,
    description: description,
  };
}

// 本文レンダラー（配列形式・HTML文字列形式の両方に対応）
function RenderContent({ content }: { content: any }) {
  if (!content) return null;

  // ブロック配列形式（JSON構造）の場合
  if (Array.isArray(content)) {
    return (
      <div className="space-y-6">
        {content.map((block: any, index: number) => {
          switch (block.type) {
            case "heading":
              return block.level === 2 ? (
                <h2
                  key={index}
                  className="text-2xl font-bold text-gray-900 border-b pb-2 pt-6 mt-8"
                >
                  {block.text}
                </h2>
              ) : (
                <h3
                  key={index}
                  className="text-xl font-bold text-gray-800 pt-4 mt-6"
                >
                  {block.text}
                </h3>
              );
            case "paragraph":
              return (
                <p key={index} className="text-gray-700 leading-relaxed text-base">
                  {block.text}
                </p>
              );
            case "list":
              return (
                <ul key={index} className="list-disc list-inside space-y-1 my-4">
                  {block.items?.map((item: string, i: number) => (
                    <li key={i} className="text-gray-700">
                      {item}
                    </li>
                  ))}
                </ul>
              );
            case "image":
              return (
                <figure key={index} className="my-8">
                  <div className="relative w-full h-80 rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={block.src}
                      alt={block.alt || "記事画像"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {block.caption && (
                    <figcaption className="text-center text-xs text-gray-500 mt-2">
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

  // HTML文字列形式の場合
  if (typeof content === "string") {
    return (
      <div
        className="prose prose-lg max-w-none text-gray-800 leading-relaxed [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:border-b [&>h2]:pb-2 [&>h2]:pt-6 [&>h2]:mt-8 [&>p]:my-4 [&>p]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return null;
}

// 記事詳細ページ
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const aiSummary =
    article.summary ||
    article.aiSummary ||
    article.ai_summary ||
    article.description;

  const mainContent =
    article.content || article.body || article.text;

  const eyeCatchUrl =
    article.eyecatch?.url ||
    article.thumbnail?.url ||
    article.thumbnailUrl;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* ナビゲーション */}
      <nav className="text-xs text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:underline text-gray-600">
          HOME
        </Link>
        <span>/</span>
        <span className="uppercase text-blue-600 font-semibold">
          {article.category?.label || article.category?.name || "TACTICS"}
        </span>
      </nav>

      <article>
        {/* 公開日 */}
        <p className="text-sm text-gray-500 mb-2">
          {new Date(article.publishedAt || article.createdAt).toLocaleDateString(
            "ja-JP",
            { year: "numeric", month: "long", day: "numeric" }
          )}
        </p>

        {/* 記事タイトル */}
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-6">
          {article.title}
        </h1>

        {/* アイキャッチ画像 */}
        {eyeCatchUrl && (
          <div className="relative w-full h-64 sm:h-96 rounded-2xl overflow-hidden mb-8 bg-gray-100 shadow-sm">
            <Image
              src={eyeCatchUrl}
              alt={article.title}
              fill
              priority
              className="object-cover"
            />
          </div>
        )}

        {/* AI 3行要約ボックス */}
        {aiSummary && (
          <section className="mb-10 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-blue-900 font-bold text-sm tracking-wider uppercase">
              <span className="text-lg">✨</span>
              <span>AI 要約</span>
            </div>
            <p className="text-gray-800 leading-relaxed text-base whitespace-pre-wrap">
              {aiSummary}
            </p>
          </section>
        )}

        {/* 記事本文 */}
        <div className="mt-8">
          <RenderContent content={mainContent} />
        </div>
      </article>

      {/* 戻るリンク */}
      <div className="mt-16 pt-8 border-t border-gray-200">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          ← 記事一覧に戻る
        </Link>
      </div>
    </div>
  );
}
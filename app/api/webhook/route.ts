import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function GET() {
  return NextResponse.json({ status: "Webhook endpoint is active" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Incoming Webhook Body:", JSON.stringify(body, null, 2));

    const contentId = body.id || body.contents?.new?.id;
    const publishValue = body.contents?.new?.publishValue || body;
    const title = publishValue.title || "";
    const rawContent = publishValue.content || publishValue.body || "";
    const cleanContent = rawContent.replace(/<[^>]*>?/gm, "").slice(0, 800);

    if (!contentId) {
      return NextResponse.json({ message: "No contentId" }, { status: 200 });
    }

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    // モデル名を gemini-1.5-flash-latest に変更
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `あなたはNBA専門のSEOライターです。以下の記事のタイトルと本文を読み、SEOに強いタイトル案（32文字以内）と、記事の要約（100〜120文字程度）を作成してください。

必ず以下のJSONフォーマットのみを返してください。Markdown記法やコードブロック（\`\`\`json）は含めないでください。
{"seoTitle": "タイトル", "summary": "要約"}

記事タイトル: ${title}
記事本文: ${cleanContent || title}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    console.log("Gemini Raw Response:", responseText);

    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
    const { seoTitle, summary } = JSON.parse(cleanedJson);

    console.log("Parsed AI Output:", { seoTitle, summary });

    // microCMS に PATCH
    const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
    const microcmsKey = process.env.MICROCMS_API_KEY;

    const patchRes = await fetch(
      `https://${serviceDomain}.microcms.io/api/v1/articles/${contentId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-MICROCMS-API-KEY": microcmsKey || "",
        },
        body: JSON.stringify({
          seoTitle,
          summary,
        }),
      }
    );

    const patchData = await patchRes.json();
    console.log("microCMS Patch Result:", patchData);

    return NextResponse.json({ success: true, seoTitle, summary });
  } catch (error: any) {
    console.error("Webhook Error Details:", error?.message || error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function GET() {
  return NextResponse.json({ status: "Webhook endpoint is active" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, contents } = body;

    // microCMS のコンテンツデータ取得
    const contentId = id || contents?.new?.id;
    const title = contents?.new?.publishValue?.title || "";
    const content = contents?.new?.publishValue?.content || "";

    if (!contentId || !content) {
      return NextResponse.json({ message: "No content to process" }, { status: 200 });
    }

    // 既にAI生成が入っている場合の無限ループ防止
    if (contents?.new?.publishValue?.seoTitle && contents?.new?.publishValue?.summary) {
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    // Gemini で SEOタイトル と 要約 を生成
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `以下のブログ記事のタイトルと本文を読み、SEOに強いタイトル案（32文字以内）と、記事の要約（120文字程度）を作成してください。
必ず以下のJSON形式のみを出力してください。バッククォートなどのマークダウン修飾は不要です。

{"seoTitle": "ここにタイトル", "summary": "ここに要約"}

記事タイトル: ${title}
記事本文: ${content}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
    const { seoTitle, summary } = JSON.parse(cleanedJson);

    // microCMS に PATCH リクエストを送って自動更新
    const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
    const apiKey = process.env.MICROCMS_API_KEY;

    await fetch(`https://${serviceDomain}.microcms.io/api/v1/articles/${contentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-MICROCMS-API-KEY": apiKey || "",
      },
      body: JSON.stringify({
        seoTitle,
        summary,
      }),
    });

    return NextResponse.json({ success: true, seoTitle, summary });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

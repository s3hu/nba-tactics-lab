import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function GET() {
  return NextResponse.json({ status: "Webhook endpoint is active" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Incoming Webhook Body:", JSON.stringify(body, null, 2));

    // microCMS の Webhook ペイロードから値を取得
    const contentId = body.id || body.contents?.new?.id;
    const publishValue = body.contents?.new?.publishValue || body;
    const title = publishValue.title || "";
    // リッチエディタまたはテキストエリアのフィールド名
    const content = publishValue.content || publishValue.body || "";

    console.log("Parsed:", { contentId, title, hasContent: !!content });

    if (!contentId) {
      console.log("Skip: No contentId found");
      return NextResponse.json({ message: "No contentId" }, { status: 200 });
    }

    // Gemini で生成
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `以下のブログ記事のタイトルと本文を読み、SEOに強いタイトル案（32文字以内）と、記事の要約（120文字程度）を作成してください。
必ず以下のJSON形式のみを出力してください。バッククォートなどのマークダウン修飾は不要です。

{"seoTitle": "ここにタイトル", "summary": "ここに要約"}

記事タイトル: ${title}
記事本文: ${content || title}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
    const { seoTitle, summary } = JSON.parse(cleanedJson);

    console.log("Generated:", { seoTitle, summary });

    // microCMS に PATCH
    const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
    const apiKey = process.env.MICROCMS_API_KEY;

    const patchRes = await fetch(
      `https://${serviceDomain}.microcms.io/api/v1/articles/${contentId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-MICROCMS-API-KEY": apiKey || "",
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
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

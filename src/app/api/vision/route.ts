import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { base64Image, mimeType, prompt } = await req.json();

    if (!base64Image || !prompt) {
      return NextResponse.json(
        { error: "Image and prompt are required" },
        { status: 400 }
      );
    }

    const xaiApiKey = process.env.XAI_API_KEY;
    if (!xaiApiKey) {
      return NextResponse.json(
        { error: "XAI API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-vision-1212",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. When a user uploads an image, analyze it and describe what you visually observe — objects, text, colors, patterns, and any notable details. Always attempt to analyze the image. Never refuse to describe an image.",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
              {
                type: "text",
                text: `${prompt}\n\nAuto detect language from the question and reply in same language. If image contains code, analyze it carefully. If image contains an error, explain it and provide fix. Be helpful and detailed.`,
              },
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("xAI API error:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "Vision analysis failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    return NextResponse.json({ response: content });

  } catch (error: unknown) {
    console.error("Vision error:", error);
    const errorMessage = error instanceof Error ? error.message : "Vision analysis failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

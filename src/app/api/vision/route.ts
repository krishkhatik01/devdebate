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

    // Log for debugging
    console.log("XAI_API_KEY present:", !!xaiApiKey);
    console.log("base64Image length:", base64Image?.length);
    console.log("mimeType:", mimeType);

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
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
              {
                type: "text",
                text: prompt || "Analyze this image",
              },
            ],
          },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: "Unknown error", status: response.status };
      }
      console.error("xAI API error:", JSON.stringify(errorData, null, 2));
      return NextResponse.json(
        { error: errorData.error?.message || errorData.message || "Vision analysis failed" },
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

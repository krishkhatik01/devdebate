import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { base64Image, mimeType, prompt } = await req.json();

    if (!base64Image || !prompt) {
      return NextResponse.json(
        { error: "Image and prompt are required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
      prompt || "Analyze this image in detail",
    ]);

    const response = result.response.text();
    return NextResponse.json({ response });

  } catch (error: unknown) {
    console.error("Vision error:", error);
    const errorMessage = error instanceof Error ? error.message : "Vision analysis failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

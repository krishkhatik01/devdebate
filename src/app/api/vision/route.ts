import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Auto-detect working model
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro-vision"
];

async function getWorkingModel(): Promise<GenerativeModel> {
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      // Test with a simple request
      await model.generateContent("test");
      console.log(`✅ Working Gemini model found: ${modelName}`);
      return model;
    } catch {
      console.log(`❌ Model ${modelName} failed, trying next...`);
      continue;
    }
  }
  throw new Error("No working Gemini model found");
}

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

    // Auto-detect and use the first working Gemini model
    const model = await getWorkingModel();

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

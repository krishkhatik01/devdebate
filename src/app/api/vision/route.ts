import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  console.log("=== VISION API CALLED ===");
  console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
  console.log("GEMINI_API_KEY prefix:", process.env.GEMINI_API_KEY?.substring(0, 20));

  try {
    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY is missing!");
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing in .env.local" },
        { status: 500 }
      );
    }

    // Parse request
    const { image, mimeType, message } = await req.json();
    console.log("Image received:", !!image);
    console.log("MimeType:", mimeType);
    console.log("Message:", message);

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Init Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // First fetch available models from Gemini
    const modelsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    const modelsData = await modelsResponse.json();
    console.log("Available models:", JSON.stringify(modelsData, null, 2));

    // Filter only models that support generateContent
    const availableModels = modelsData.models
      ?.filter((m: { supportedGenerationMethods?: string[]; name: string }) =>
        m.supportedGenerationMethods?.includes("generateContent") &&
        m.name.includes("gemini")
      )
      .map((m: { name: string }) => m.name.replace("models/", ""));

    console.log("Usable models:", availableModels);

    // Use first available model
    const MODELS = availableModels?.length > 0
      ? availableModels
      : ["gemini-2.0-flash"];

    let lastError = null;

    for (const modelName of MODELS) {
      try {
        console.log(`🔄 Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: image,
            },
          },
          message || "Analyze this image in detail",
        ]);

        const response = result.response.text();
        console.log(`✅ Success with model: ${modelName}`);

        return NextResponse.json({ result: response });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.log(`❌ Model ${modelName} failed:`, errorMessage);
        lastError = err;
        continue;
      }
    }

    // All models failed
    const lastErrorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    console.error("❌ All models failed. Last error:", lastErrorMessage);
    return NextResponse.json(
      { error: `All Gemini models failed: ${lastErrorMessage}` },
      { status: 500 }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : "";
    console.error("=== FULL ERROR ===");
    console.error("Message:", errorMessage);
    console.error("Stack:", errorStack);
    return NextResponse.json(
      { error: errorMessage || "Vision analysis failed" },
      { status: 500 }
    );
  }
}

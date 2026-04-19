import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { base64Image, mimeType, prompt } = await req.json();

    if (!base64Image || !prompt) {
      return NextResponse.json(
        { error: "Image and prompt are required" },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
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
              text: `${prompt}
              
              Auto detect language from the question and reply in same language.
              If image contains code, analyze it carefully.
              If image contains an error, explain it and provide fix.
              Be helpful and detailed.`,
            },
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const response = completion.choices[0]?.message?.content || "";
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

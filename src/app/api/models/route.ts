import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    // Filter only chat models, exclude whisper/vision
    const chatModels = data.data
      .filter((m: { id: string; active?: boolean }) =>
        !m.id.includes("whisper") &&
        !m.id.includes("guard") &&
        !m.id.includes("tool") &&
        !m.id.includes("vision") &&
        m.active !== false
      )
      .map((m: { id: string }) => ({ id: m.id, name: m.id }));

    return NextResponse.json({ models: chatModels });
  } catch (error: unknown) {
    console.error("Failed to fetch models:", error);
    return NextResponse.json({ error: "Failed to fetch models" },
      { status: 500 });
  }
}

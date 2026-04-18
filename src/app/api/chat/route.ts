import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: systemPrompt || "You are an expert software engineer and developer assistant. Answer concisely, use code blocks when relevant, and always explain your reasoning.",
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const content = completion.choices[0]?.message?.content || "No response generated";
    return NextResponse.json({ content });
  } catch (error: unknown) {
    console.error("Groq API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get response" },
      { status: 500 }
    );
  }
}

import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const LANGUAGE_RULE = `
IMPORTANT LANGUAGE RULE: Detect the language of the user's message and always reply in the SAME language and style.
- If user writes in English → reply in English
- If user writes in Hindi (Devanagari script) → reply in Hindi
- If user writes in Hinglish (Hindi words in English script mixed with English) → reply in casual Hinglish. Example style: "Bhai yeh basically ek closure hai jo outer function ke variables ko access kar sakta hai even after function return ho jaaye."
- Never switch language unless user switches first
- Match the user's energy — casual tone for casual messages, technical tone for technical questions
`;

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const fullSystemPrompt = systemPrompt
      ? `${LANGUAGE_RULE}\n\n${systemPrompt}`
      : `${LANGUAGE_RULE}\n\nYou are an expert software engineer and developer assistant. Answer concisely, use code blocks when relevant, and always explain your reasoning.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: fullSystemPrompt,
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

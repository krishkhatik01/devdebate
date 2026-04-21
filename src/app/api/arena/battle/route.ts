import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const {
      topic, context, forModel, againstModel,
      round, totalRounds, roundType, messages
    } = await req.json();

    // FOR argument
    const forRes = await groq.chat.completions.create({
      model: forModel,
      messages: [
        {
          role: "system",
          content: `You are a passionate AI model arguing STRONGLY IN FAVOR of the topic.
Topic: "${topic}"
Context: ${context || "general"}
This is Round ${round} of ${totalRounds} — ${roundType} argument.
Rules:
- Give a powerful ${roundType} argument in 3-4 sentences max
- Use specific technical examples
- Be confident and direct
- Do NOT start with "I" 
- Do NOT say "As an AI"
- Just argue your point strongly`
        },
        ...messages
      ],
      temperature: 0.85,
      max_tokens: 250,
    });

    const forArgument = forRes.choices[0]?.message?.content || "";

    // AGAINST argument  
    const againstRes = await groq.chat.completions.create({
      model: againstModel,
      messages: [
        {
          role: "system",
          content: `You are a passionate AI model arguing STRONGLY AGAINST the topic.
Topic: "${topic}"
Context: ${context || "general"}
This is Round ${round} of ${totalRounds} — ${roundType} argument.
The FOR side just argued: "${forArgument}"
Rules:
- Counter their argument AND make your own point
- Give a powerful response in 3-4 sentences max
- Use specific technical examples
- Be direct and convincing
- Do NOT start with "I"
- Do NOT say "As an AI"
- Demolish their argument`
        },
        ...messages
      ],
      temperature: 0.85,
      max_tokens: 250,
    });

    const againstArgument = againstRes.choices[0]?.message?.content || "";

    // Judge
    const judgeRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an impartial AI debate judge. Score each argument.
Criteria: Technical accuracy (0-3), Persuasiveness (0-3), Examples (0-2), Clarity (0-2). Total: 0-10.
Respond ONLY with valid JSON, no extra text, no markdown:
{"forScore":number,"againstScore":number,"forFeedback":"one sentence","againstFeedback":"one sentence","roundWinner":"for or against or draw"}`
        },
        {
          role: "user",
          content: `Topic: ${topic}\nFOR: ${forArgument}\nAGAINST: ${againstArgument}`
        }
      ],
      temperature: 0.1,
      max_tokens: 150,
    });

    const judgeText = judgeRes.choices[0]?.message?.content || "{}";
    let judgeData;
    try {
      judgeData = JSON.parse(judgeText.replace(/```json|```/g, "").trim());
    } catch {
      judgeData = {
        forScore: 7, againstScore: 7,
        forFeedback: "Strong argument made.",
        againstFeedback: "Good counter points.",
        roundWinner: "draw"
      };
    }

    return NextResponse.json({
      forArgument,
      againstArgument,
      round,
      roundType,
      ...judgeData,
    });

  } catch (error: unknown) {
    console.error("Battle error:", error);
    const errorMessage = error instanceof Error ? error.message : "Battle failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

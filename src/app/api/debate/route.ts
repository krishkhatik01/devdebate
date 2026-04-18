import { NextRequest } from 'next/server';
import groq, { MODEL } from '@/lib/groq';

const LANGUAGE_RULE = `
IMPORTANT LANGUAGE RULE: Detect the language of the user's topic/context and respond in that SAME language throughout.
- If user writes in English → reply in English
- If user writes in Hindi (Devanagari script) → reply in Hindi
- If user writes in Hinglish (Hindi words in English script mixed with English) → reply in casual Hinglish
- Never switch language unless user switches first
`;

export async function POST(req: NextRequest) {
  try {
    const { topic, context } = await req.json();

    // Make 3 parallel API calls
    const [forResponse, againstResponse, verdictResponse] = await Promise.all([
      // FOR argument
      groq.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `${LANGUAGE_RULE}\n\nYou are a passionate senior developer arguing STRONGLY IN FAVOR of "${topic}". Give 4 powerful technical arguments with code examples where relevant. Be convincing and specific. Format with markdown.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 1024,
      }),

      // AGAINST argument
      groq.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `${LANGUAGE_RULE}\n\nYou are a passionate senior developer arguing STRONGLY AGAINST "${topic}". Give 4 powerful technical arguments with code examples where relevant. Be convincing and specific. Format with markdown.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 1024,
      }),

      // Verdict
      groq.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `${LANGUAGE_RULE}\n\nYou are a neutral tech lead. Given the user's context: "${context || 'No specific context provided'}", review both sides of "${topic}" and give a FINAL VERDICT with a clear recommendation and score (FOR: X/10, AGAINST: X/10). Be decisive and provide actionable advice. Format with markdown.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    ]);

    return new Response(
      JSON.stringify({
        for: forResponse.choices[0]?.message?.content || '',
        against: againstResponse.choices[0]?.message?.content || '',
        verdict: verdictResponse.choices[0]?.message?.content || '',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Debate API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate debate' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

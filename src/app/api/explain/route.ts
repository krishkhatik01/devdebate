import { NextRequest } from 'next/server';
import groq, { MODEL } from '@/lib/groq';

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
    const { messages } = await req.json();

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `${LANGUAGE_RULE}\n\nYou are a world-class CS teacher. Explain this in 3 parts:
1) **ELI5** (simple analogy that anyone can understand)
2) **Technical Explanation** (with code examples and deep technical detail)
3) **When to Use / Common Gotchas** (practical advice and pitfalls to avoid)

Format with clear markdown headers for each section.`,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    return new Response(
      JSON.stringify({
        explanation: response.choices[0]?.message?.content || '',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Explain API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate explanation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

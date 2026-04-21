import { NextRequest } from 'next/server';
import groq, { MODEL } from '@/lib/groq';

const LANGUAGE_RULE = `
IMPORTANT LANGUAGE RULE: Detect the language of the user's message and always reply in the SAME language and style.
- If user writes in English → reply in English
- If user writes in Hindi (Devanagari script) → reply in Hindi
- If user writes in Hinglish (Hindi words in English script mixed with English) → reply in casual Hinglish
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
          content: `${LANGUAGE_RULE}\n\nYou are a senior tech researcher. Write a comprehensive research report covering:
- **Overview** (what is this technology/approach)
- **Key Options/Approaches** (main alternatives and variations)
- **Pros & Cons** (formatted as a comparison table when possible)
- **Performance Benchmarks** (if applicable)
- **Community & Ecosystem** (adoption, tooling, support)
- **Recommendations** (for different use cases and team sizes)

Format with clear markdown headers and tables where appropriate. Be thorough and objective.`,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    return new Response(
      JSON.stringify({
        report: response.choices[0]?.message?.content || '',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Research API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate research report' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

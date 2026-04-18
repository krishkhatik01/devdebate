import { NextRequest } from 'next/server';
import groq, { MODEL } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a world-class CS teacher. Explain this in 3 parts:
1) **ELI5** (simple analogy that anyone can understand)
2) **Technical Explanation** (with code examples and deep technical detail)
3) **When to Use / Common Gotchas** (practical advice and pitfalls to avoid)

Format with clear markdown headers for each section.`,
        },
        {
          role: 'user',
          content: input,
        },
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

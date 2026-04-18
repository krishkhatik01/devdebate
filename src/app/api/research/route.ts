import { NextRequest } from 'next/server';
import groq, { MODEL } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a senior tech researcher. Write a comprehensive research report covering:
- **Overview** (what is this technology/approach)
- **Key Options/Approaches** (main alternatives and variations)
- **Pros & Cons** (formatted as a comparison table when possible)
- **Performance Benchmarks** (if applicable)
- **Community & Ecosystem** (adoption, tooling, support)
- **Recommendations** (for different use cases and team sizes)

Format with clear markdown headers and tables where appropriate. Be thorough and objective.`,
        },
        {
          role: 'user',
          content: `Write a research report on: ${topic}`,
        },
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

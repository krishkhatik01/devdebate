import { NextRequest } from 'next/server';
import groq, { MODEL } from '@/lib/groq';

const LANGUAGE_RULE = `
IMPORTANT LANGUAGE RULE: Detect the language of the user's code comments or message and reply in that SAME language.
- If user writes in English → reply in English
- If user writes in Hindi (Devanagari script) → reply in Hindi
- If user writes in Hinglish (Hindi words in English script mixed with English) → reply in casual Hinglish
- Never switch language unless user switches first
- Match the user's energy — casual tone for casual messages, savage roasting for roast mode
`;

export async function POST(req: NextRequest) {
  try {
    const { code, intensity } = await req.json();

    const intensityDescriptions: Record<string, string> = {
      mild: 'gentle constructive criticism with some humor',
      medium: 'honest critique with witty roasts and solid technical feedback',
      nuclear: 'absolutely brutal, merciless roasting that destroys the code while being hilarious',
    };

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `${LANGUAGE_RULE}\n\nYou are a brutally honest senior engineer doing a savage code review. Roast this code at ${intensity} level (${intensityDescriptions[intensity]}). Point out every bad practice, naming issue, performance problem, and security flaw. Use humor and sarcasm. Then provide a "REDEEMED VERSION" section with the completely fixed code.`,
        },
        {
          role: 'user',
          content: `Roast this code:\n\n\`\`\`\n${code}\n\`\`\``,
        },
      ],
      temperature: 0.9,
      max_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content || '';

    // Split into roast and fixed sections
    const parts = content.split(/REDEEMED VERSION/i);
    const roast = parts[0]?.trim() || content;
    const fixed = parts[1]?.trim() || 'No fixed version provided.';

    return new Response(
      JSON.stringify({ roast, fixed }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Roast API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to roast code' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

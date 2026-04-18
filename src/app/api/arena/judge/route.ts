import { NextRequest } from 'next/server';
import groq, { MODEL } from '@/lib/groq';

interface JudgeRequest {
  topic: string;
  round: number;
  roundType: 'opening' | 'counter' | 'closing';
  forArgument: string;
  againstArgument: string;
  previousRounds?: Array<{
    forScore: number;
    againstScore: number;
  }>;
}

interface JudgeResponse {
  forScore: number;
  againstScore: number;
  forFeedback: string;
  againstFeedback: string;
  roundWinner: 'for' | 'against' | 'draw';
  verdict: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: JudgeRequest = await req.json();
    const { topic, round, roundType, forArgument, againstArgument } = body;

    const roundTypeDescriptions = {
      opening: 'opening statements - introducing their position',
      counter: 'counter arguments - responding to the opponent',
      closing: 'closing statements - summarizing their case',
    };

    const systemPrompt = `You are an impartial AI judge for a tech debate competition. 

Topic: "${topic}"
Round ${round}: ${roundTypeDescriptions[roundType]}

Score each argument fairly based on:
1. Technical accuracy (0-3 points)
2. Clarity and structure (0-3 points)  
3. Persuasiveness (0-2 points)
4. Use of examples (0-2 points)
Total: 0-10 per side

Respond ONLY in this exact JSON format:
{
  "forScore": number,
  "againstScore": number,
  "forFeedback": "string (1-2 sentences)",
  "againstFeedback": "string (1-2 sentences)",
  "roundWinner": "for" | "against" | "draw",
  "verdict": "string (2-3 sentences explaining scores)"
}`;

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `FOR argument:\n${forArgument}\n\nAGAINST argument:\n${againstArgument}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content || '';

    // Parse JSON response
    let result: JudgeResponse;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      console.error('Failed to parse AI judge response:', content);
      // Fallback response
      result = {
        forScore: 5,
        againstScore: 5,
        forFeedback: 'Argument received but scoring failed.',
        againstFeedback: 'Argument received but scoring failed.',
        roundWinner: 'draw',
        verdict: 'Unable to determine a clear winner for this round.',
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Arena judge API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to judge debate' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

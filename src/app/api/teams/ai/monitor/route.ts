import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// AI Monitor - watches chat and suggests when to respond
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ shouldRespond: false });
    }

    // Check if AI was mentioned
    const lastMessage = messages[messages.length - 1];
    const hasMention = lastMessage.text.toLowerCase().includes('@ai') ||
      lastMessage.text.toLowerCase().includes('@devbot');

    if (hasMention) {
      return NextResponse.json({ shouldRespond: true, reason: 'mentioned' });
    }

    // Check for questions that AI should answer
    const questionPatterns = [
      /\?$/, // Ends with question mark
      /^(what|how|why|when|where|who|which|can|could|would|should|is|are|do|does|did)\s/i,
      /explain|help|assist|suggest|recommend|advice/i,
      /error|bug|issue|problem|fix|debug/i,
      /code|function|implement|create|write/i,
    ];

    const looksLikeQuestion = questionPatterns.some(pattern =>
      pattern.test(lastMessage.text)
    );

    // Check time since last AI response (don't spam)
    const lastAIResponse = messages
      .slice()
      .reverse()
      .find((m: { isAI: boolean }) => m.isAI);

    const timeSinceAIResponse = lastAIResponse
      ? Date.now() - lastAIResponse.timestamp
      : Infinity;

    const minTimeBetweenResponses = 30000; // 30 seconds

    if (looksLikeQuestion && timeSinceAIResponse > minTimeBetweenResponses) {
      // Use AI to determine if it should respond
      const shouldRespond = await evaluateIfShouldRespond(messages);
      return NextResponse.json({ shouldRespond, reason: 'question' });
    }

    return NextResponse.json({ shouldRespond: false });
  } catch (error) {
    console.error('AI Monitor error:', error);
    return NextResponse.json({ shouldRespond: false });
  }
}

async function evaluateIfShouldRespond(messages: Array<{ text: string; senderName: string; isAI: boolean }>): Promise<boolean> {
  try {
    if (!GROQ_API_KEY) {
      // Fallback: respond to obvious questions
      const lastMessage = messages[messages.length - 1];
      return lastMessage.text.length > 10 &&
        (lastMessage.text.includes('?') ||
          /^(how|what|why|can|could|help)/i.test(lastMessage.text));
    }

    const recentMessages = messages.slice(-5);
    const conversation = recentMessages.map(m =>
      `${m.isAI ? 'AI' : m.senderName}: ${m.text}`
    ).join('\n');

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are DevBot, an AI assistant in a team chat. Determine if you should respond to the latest message.
Respond with ONLY "yes" or "no".

Respond YES if:
- Someone asks a technical question
- Someone needs help with code
- There's a problem to solve
- The conversation needs your expertise

Respond NO if:
- It's just casual chat between humans
- Someone already answered the question
- It's not relevant to your expertise
- You just responded recently`,
          },
          {
            role: 'user',
            content: `Recent conversation:\n${conversation}\n\nShould you respond to the last message? Answer yes or no only.`,
          },
        ],
        temperature: 0.1,
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content?.toLowerCase().trim() || 'no';
    return answer.includes('yes');
  } catch (error) {
    console.error('Error evaluating response:', error);
    return false;
  }
}

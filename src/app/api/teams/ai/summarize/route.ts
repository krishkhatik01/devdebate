import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Summarize conversation or generate meeting summary
export async function POST(req: NextRequest) {
  try {
    const { messages, type = 'conversation' } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ summary: 'No messages to summarize.' });
    }

    // Filter out system messages and AI responses for cleaner summary
    const relevantMessages = messages.filter((m: { isAI: boolean }) => !m.isAI);

    if (relevantMessages.length === 0) {
      return NextResponse.json({ summary: 'No user messages to summarize.' });
    }

    // Format messages for AI
    const conversation = relevantMessages.map((m: { senderName: string; text: string; timestamp: number }) => {
      const time = new Date(m.timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return `[${time}] ${m.senderName}: ${m.text}`;
    }).join('\n');

    if (!GROQ_API_KEY) {
      // Fallback summary
      const summary = generateFallbackSummary(relevantMessages, type);
      return NextResponse.json({ summary });
    }

    const systemPrompt = type === 'meeting'
      ? `You are DevBot, an AI meeting assistant. Create a structured meeting summary with:
1. Key Discussion Points (bullet points)
2. Decisions Made
3. Action Items (with assignees if mentioned)
4. Next Steps

Keep it concise and professional.`
      : `You are DevBot, an AI assistant. Summarize the conversation briefly:
- Highlight key points
- Mention any decisions or conclusions
- Note any action items or next steps
- Keep it under 150 words`;

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
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Please summarize this conversation:\n\n${conversation}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const summary = generateFallbackSummary(relevantMessages, type);
      return NextResponse.json({ summary });
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content || 'Summary unavailable.';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarize error:', error);
    return NextResponse.json({
      summary: 'Unable to generate summary at this time.'
    });
  }
}

function generateFallbackSummary(
  messages: Array<{ senderName: string; text: string }>,
  type: string
): string {
  const participants = Array.from(new Set(messages.map(m => m.senderName)));
  const totalMessages = messages.length;

  // Extract key topics (simple keyword matching)
  const topics: string[] = [];
  const topicKeywords: Record<string, string[]> = {
    'Code Review': ['code', 'review', 'pr', 'pull request', 'merge'],
    'Bug Fix': ['bug', 'fix', 'error', 'issue', 'problem'],
    'Feature': ['feature', 'implement', 'add', 'new'],
    'Planning': ['plan', 'schedule', 'timeline', 'deadline'],
    'Discussion': ['discuss', 'think', 'opinion', 'idea'],
  };

  const allText = messages.map(m => m.text.toLowerCase()).join(' ');

  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(k => allText.includes(k))) {
      topics.push(topic);
    }
  });

  if (type === 'meeting') {
    return `## Meeting Summary

**Participants:** ${participants.join(', ')}  
**Total Messages:** ${totalMessages}

**Topics Discussed:**
${topics.length > 0 ? topics.map(t => `- ${t}`).join('\n') : '- General discussion'}

**Key Points:**
- ${messages.length} messages exchanged
- ${participants.length} participants engaged
- Primary focus: ${topics[0] || 'General team discussion'}

*Note: AI summary unavailable. This is an auto-generated summary.*`;
  }

  return `**Conversation Summary**

${participants.length} participants exchanged ${totalMessages} messages. 

**Topics:** ${topics.join(', ') || 'General discussion'}

*Note: AI summary unavailable. This is an auto-generated summary.*`;
}

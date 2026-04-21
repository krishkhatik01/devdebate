import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Auto-extract tasks from conversation
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ tasks: [] });
    }

    // Filter for messages that might contain tasks
    const relevantMessages = messages.filter((m: { text: string }) => {
      const text = m.text.toLowerCase();
      return text.includes('task') ||
        text.includes('todo') ||
        text.includes('need to') ||
        text.includes('should') ||
        text.includes('will') ||
        text.includes('going to') ||
        text.includes('fix') ||
        text.includes('implement') ||
        text.includes('create');
    });

    if (relevantMessages.length === 0) {
      return NextResponse.json({ tasks: [] });
    }

    const conversation = relevantMessages.map((m: { senderName: string; text: string }) =>
      `${m.senderName}: ${m.text}`
    ).join('\n');

    if (!GROQ_API_KEY) {
      // Fallback: simple regex-based extraction
      const tasks = extractTasksFallback(relevantMessages);
      return NextResponse.json({ tasks });
    }

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
            content: `You are DevBot, an AI task extractor. Extract actionable tasks from the conversation.

Return ONLY a JSON array of tasks in this format:
[
  {
    "title": "Task title",
    "description": "Brief description",
    "priority": "low|medium|high|urgent",
    "suggestedAssignee": "name or null"
  }
]

Rules:
- Extract clear, actionable tasks only
- Infer priority based on urgency words (urgent, asap, critical = high)
- Suggest assignee if mentioned
- Return empty array [] if no tasks found
- Return ONLY the JSON, no other text`,
          },
          {
            role: 'user',
            content: `Extract tasks from this conversation:\n\n${conversation}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const tasks = extractTasksFallback(relevantMessages);
      return NextResponse.json({ tasks });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';

    // Parse JSON response
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const tasks = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      return NextResponse.json({ tasks });
    } catch {
      const tasks = extractTasksFallback(relevantMessages);
      return NextResponse.json({ tasks });
    }
  } catch (error) {
    console.error('Task extraction error:', error);
    return NextResponse.json({ tasks: [] });
  }
}

function extractTasksFallback(messages: Array<{ text: string; senderName: string }>): Array<{
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  suggestedAssignee: string | null;
}> {
  const tasks: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    suggestedAssignee: string | null;
  }> = [];

  const taskPatterns = [
    /(?:need to|should|will|going to|must|have to)\s+(.+?)(?:\.|$)/i,
    /(?:task|todo):?\s+(.+?)(?:\.|$)/i,
    /(?:fix|implement|create|add|update)\s+(.+?)(?:\.|$)/i,
  ];

  messages.forEach((msg) => {
    taskPatterns.forEach((pattern) => {
      const match = msg.text.match(pattern);
      if (match) {
        const title = match[1].trim();
        if (title.length > 5 && title.length < 100) {
          const priority: 'low' | 'medium' | 'high' | 'urgent' =
            /urgent|asap|critical|important/i.test(msg.text) ? 'high' : 'medium';

          tasks.push({
            title: title.charAt(0).toUpperCase() + title.slice(1),
            description: `From conversation with ${msg.senderName}`,
            priority,
            suggestedAssignee: null,
          });
        }
      }
    });
  });

  // Remove duplicates
  const seen = new Set<string>();
  return tasks.filter((t) => {
    const key = t.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

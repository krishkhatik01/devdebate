import { NextRequest } from 'next/server';
import groq, { MODEL } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a performance optimization expert. Analyze this ${language} code and provide:

1) **Issues Found** (time complexity, memory usage, readability problems, anti-patterns)
2) **Optimized Version** (with detailed comments explaining each change)
3) **Before/After Analysis** (complexity comparison and expected performance gains)

Be specific about Big O notation and practical improvements.`,
        },
        {
          role: 'user',
          content: `Optimize this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
        },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });

    const content = response.choices[0]?.message?.content || '';

    // Try to extract issues and optimized code sections
    const lines = content.split('\n');
    let issues = '';
    let optimized = '';
    let currentSection = '';

    for (const line of lines) {
      if (line.toLowerCase().includes('issue') || line.toLowerCase().includes('problem')) {
        currentSection = 'issues';
        continue;
      }
      if (line.toLowerCase().includes('optimized') || line.toLowerCase().includes('fixed')) {
        currentSection = 'optimized';
        continue;
      }

      if (currentSection === 'issues') {
        issues += line + '\n';
      } else if (currentSection === 'optimized') {
        optimized += line + '\n';
      }
    }

    // If parsing failed, use the whole content for both
    if (!issues.trim()) issues = content;
    if (!optimized.trim()) optimized = content;

    return new Response(
      JSON.stringify({ issues, optimized }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Optimize API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to optimize code' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

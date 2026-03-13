import { streamText, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { agentTools } from '@/lib/agent/tools';
import { SYSTEM_PROMPT } from '@/lib/agent/system-prompt';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: openai('gpt-5.4'),
      system: SYSTEM_PROMPT,
      messages,
      tools: agentTools,
      stopWhen:    stepCountIs(15),
      temperature: 0.1,
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Agent error';
    console.error('[/api/agent]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

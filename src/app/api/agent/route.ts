import { streamText, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { agentTools } from '@/lib/agent/tools';
import { getSystemPrompt } from '@/lib/agent/system-prompt';

export const runtime = 'nodejs';
export const maxDuration = 60;

const messageSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system', 'tool']),
        content: z.string().max(50_000),
      }),
    )
    .min(1)
    .max(100),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: ' + parsed.error.issues[0]?.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const { messages } = parsed.data;

    const result = streamText({
      model: openai('gpt-5-mini'),
      system: await getSystemPrompt(),
      messages: messages as Parameters<typeof streamText>[0]['messages'] & object,
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

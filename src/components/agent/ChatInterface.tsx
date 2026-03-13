'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { useAgentStore } from '@/lib/store/agent-store';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import type { WidgetSpec } from '@/lib/agent/types';

interface ToolCall {
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  output?: unknown;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls: ToolCall[];
}

type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

function mapToolState(state: ToolCall['state']): 'partial-call' | 'call' | 'result' {
  if (state === 'input-streaming') return 'partial-call';
  if (state === 'input-available') return 'call';
  return 'result';
}

export function ChatInterface() {
  const { addWidget, setWidgetData } = useAgentStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Use refs to avoid stale closures in the stream handler
  const addWidgetRef = useRef(addWidget);
  addWidgetRef.current = addWidget;
  const setWidgetDataRef = useRef(setWidgetData);
  setWidgetDataRef.current = setWidgetData;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchWidgetData = useCallback(async (widgetId: string, sql: string) => {
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Query failed');
      setWidgetDataRef.current(widgetId, {
        rows: Array.isArray(json) ? json : (json.rows ?? []),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setWidgetDataRef.current(widgetId, {
        rows: [],
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
      });
    }
  }, []);

  const processToolOutput = useCallback((output: unknown) => {
    if (
      output &&
      typeof output === 'object' &&
      'id' in output &&
      'type' in output &&
      'title' in output
    ) {
      const spec = output as WidgetSpec;
      addWidgetRef.current(spec);
      if (spec.sql) {
        fetchWidgetData(spec.id, spec.sql);
      }
    }
  }, [fetchWidgetData]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || status === 'streaming' || status === 'submitted') return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      toolCalls: [],
    };

    const conversationMessages = [...messages, userMsg];
    setMessages(conversationMessages);
    setStatus('submitted');
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const assistantId = crypto.randomUUID();
    let assistantContent = '';
    const toolCalls: ToolCall[] = [];

    // Add placeholder assistant message
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', toolCalls: [] },
    ]);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => 'Unknown error');
        throw new Error(`API error ${res.status}: ${body}`);
      }

      if (!res.body) throw new Error('No response body');

      setStatus('streaming');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Parse SSE stream with UIMessageChunk events (AI SDK v6 format)
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by \n\n
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          for (const line of part.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === '[DONE]') continue;

            let chunk: Record<string, unknown>;
            try {
              chunk = JSON.parse(raw) as Record<string, unknown>;
            } catch {
              continue;
            }

            const type = chunk.type as string;

            if (type === 'text-delta') {
              assistantContent += (chunk.delta as string) ?? '';
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m,
                ),
              );
            } else if (type === 'tool-input-start') {
              toolCalls.push({
                toolCallId: chunk.toolCallId as string,
                toolName: chunk.toolName as string,
                input: {},
                state: 'input-streaming',
              });
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, toolCalls: [...toolCalls] } : m,
                ),
              );
            } else if (type === 'tool-input-available') {
              const idx = toolCalls.findIndex(
                (t) => t.toolCallId === (chunk.toolCallId as string),
              );
              if (idx >= 0) {
                toolCalls[idx] = {
                  ...toolCalls[idx],
                  input: (chunk.input as Record<string, unknown>) ?? {},
                  state: 'input-available',
                };
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, toolCalls: [...toolCalls] } : m,
                  ),
                );
              }
            } else if (type === 'tool-output-available') {
              const idx = toolCalls.findIndex(
                (t) => t.toolCallId === (chunk.toolCallId as string),
              );
              if (idx >= 0) {
                toolCalls[idx] = {
                  ...toolCalls[idx],
                  output: chunk.output,
                  state: 'output-available',
                };
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, toolCalls: [...toolCalls] } : m,
                  ),
                );
                // Process widget tools
                processToolOutput(chunk.output);
              }
            } else if (type === 'tool-output-error') {
              const idx = toolCalls.findIndex(
                (t) => t.toolCallId === (chunk.toolCallId as string),
              );
              if (idx >= 0) {
                toolCalls[idx] = { ...toolCalls[idx], state: 'output-error' };
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, toolCalls: [...toolCalls] } : m,
                  ),
                );
              }
            }
          }
        }
      }

      setStatus('ready');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('ready');
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        setStatus('error');
        // Remove placeholder if it has no content
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantId || m.content || m.toolCalls.length > 0),
        );
      }
    }
  }, [messages, status, processToolOutput]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text) return;
      sendMessage(text);
      setInput('');
    },
    [input, sendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const isLoading = status === 'streaming' || status === 'submitted';

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground pt-8">
            Ask a question about hospital quality data.
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            content={message.content}
            toolInvocations={message.toolCalls.map((tc) => ({
              toolName: tc.toolName,
              args: tc.input,
              state: mapToolState(tc.state),
            }))}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t shrink-0">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about hospital quality metrics..."
            rows={2}
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </form>
    </div>
  );
}

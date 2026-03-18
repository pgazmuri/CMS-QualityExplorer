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
import { fetchArrowQuery } from '@/lib/arrow-client';
import type { WidgetSpec } from '@/lib/agent/types';

interface ToolCall {
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  output?: unknown;
}

export interface TextSegment { type: 'text'; text: string }
export interface ToolSegment { type: 'tool'; toolCall: ToolCall }
export type MessageSegment = TextSegment | ToolSegment;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;          // flat text for conversation history
  segments: MessageSegment[];
}

type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

function mapToolState(state: ToolCall['state']): 'partial-call' | 'call' | 'result' {
  if (state === 'input-streaming') return 'partial-call';
  if (state === 'input-available') return 'call';
  return 'result';
}

export function ChatInterface() {
  const { addWidget, setWidgetData, startTurn } = useAgentStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeBubbleRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollModeRef = useRef<'bottom' | 'pin-top' | 'none'>('bottom');

  // Use refs to avoid stale closures in the stream handler
  const addWidgetRef = useRef(addWidget);
  addWidgetRef.current = addWidget;
  const setWidgetDataRef = useRef(setWidgetData);
  setWidgetDataRef.current = setWidgetData;

  const fetchWidgetData = useCallback(async (widgetId: string, sql: string) => {
    try {
      const { rows, schema } = await fetchArrowQuery(sql);
      setWidgetDataRef.current(widgetId, {
        rows,
        schema,
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
      segments: [{ type: 'text', text }],
    };

    const conversationMessages = [...messages, userMsg];
    setMessages(conversationMessages);
    setStatus('submitted');
    setError(null);

    // Start a new turn for widget grouping
    startTurn();

    const controller = new AbortController();
    abortRef.current = controller;

    const assistantId = crypto.randomUUID();
    let assistantContent = '';
    const segments: MessageSegment[] = [];

    // Helper: get or create the last text segment
    const ensureTextSegment = (): TextSegment => {
      const last = segments[segments.length - 1];
      if (last && last.type === 'text') return last;
      const seg: TextSegment = { type: 'text', text: '' };
      segments.push(seg);
      return seg;
    };

    // Add placeholder assistant message and pin its top in view
    scrollModeRef.current = 'pin-top';
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', segments: [] },
    ]);
    // After React renders the placeholder, scroll its top into view once
    requestAnimationFrame(() => {
      activeBubbleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      scrollModeRef.current = 'none';
    });

    const updateAssistantMessage = () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: assistantContent, segments: [...segments.map(s => s.type === 'tool' ? { ...s, toolCall: { ...s.toolCall } } : { ...s })] }
            : m,
        ),
      );
    };

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
              const delta = (chunk.delta as string) ?? '';
              assistantContent += delta;
              const textSeg = ensureTextSegment();
              textSeg.text += delta;
              updateAssistantMessage();
            } else if (type === 'tool-input-start') {
              const tc: ToolCall = {
                toolCallId: chunk.toolCallId as string,
                toolName: chunk.toolName as string,
                input: {},
                state: 'input-streaming',
              };
              segments.push({ type: 'tool', toolCall: tc });
              updateAssistantMessage();
            } else if (type === 'tool-input-available') {
              const toolId = chunk.toolCallId as string;
              const seg = segments.find(
                (s): s is ToolSegment => s.type === 'tool' && s.toolCall.toolCallId === toolId,
              );
              if (seg) {
                seg.toolCall = {
                  ...seg.toolCall,
                  input: (chunk.input as Record<string, unknown>) ?? {},
                  state: 'input-available',
                };
                updateAssistantMessage();
              }
            } else if (type === 'tool-output-available') {
              const toolId = chunk.toolCallId as string;
              const seg = segments.find(
                (s): s is ToolSegment => s.type === 'tool' && s.toolCall.toolCallId === toolId,
              );
              if (seg) {
                seg.toolCall = {
                  ...seg.toolCall,
                  output: chunk.output,
                  state: 'output-available',
                };
                updateAssistantMessage();
                // Process widget tools
                processToolOutput(chunk.output);
              }
            } else if (type === 'tool-output-error') {
              const toolId = chunk.toolCallId as string;
              const seg = segments.find(
                (s): s is ToolSegment => s.type === 'tool' && s.toolCall.toolCallId === toolId,
              );
              if (seg) {
                seg.toolCall = { ...seg.toolCall, state: 'output-error' };
                updateAssistantMessage();
              }
            }
          }
        }
      }

      setStatus('ready');
      // After streaming completes, scroll to show the end of the response
      scrollModeRef.current = 'bottom';
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('ready');
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        setStatus('error');
        // Remove placeholder if it has no content
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantId || m.content || m.segments.length > 0),
        );
      }
    }
  }, [messages, status, processToolOutput]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text) return;
      // Scroll to bottom to show the new user message
      scrollModeRef.current = 'bottom';
      requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
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
        {messages.map((message, idx) => {
          const isLastAssistant = message.role === 'assistant' && idx === messages.length - 1;
          return (
            <div key={message.id} ref={isLastAssistant ? activeBubbleRef : undefined}>
              <MessageBubble
                role={message.role}
                content={message.content}
                segments={message.segments}
                isActive={isLastAssistant && isLoading}
              />
            </div>
          );
        })}
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

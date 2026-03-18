import ReactMarkdown from 'react-markdown';
import { ToolCallIndicator } from './ToolCallIndicator';
import type { MessageSegment } from './ChatInterface';

function mapToolState(state: string): 'partial-call' | 'call' | 'result' {
  if (state === 'input-streaming') return 'partial-call';
  if (state === 'input-available') return 'call';
  return 'result';
}

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  segments?: MessageSegment[];
  isActive?: boolean;
}

function MarkdownContent({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="my-1 first:mt-0 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
        ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
        li: ({ children }) => <li className="my-0.5">{children}</li>,
        h1: ({ children }) => <h3 className="font-semibold mt-2 mb-1 text-base">{children}</h3>,
        h2: ({ children }) => <h3 className="font-semibold mt-2 mb-1 text-base">{children}</h3>,
        h3: ({ children }) => <h3 className="font-semibold mt-2 mb-1 text-sm">{children}</h3>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <pre className="bg-background/50 rounded p-2 my-1 overflow-x-auto text-xs">
                <code>{children}</code>
              </pre>
            );
          }
          return <code className="bg-background/50 rounded px-1 py-0.5 text-xs">{children}</code>;
        },
        pre: ({ children }) => <>{children}</>,
        table: ({ children }) => (
          <div className="overflow-x-auto my-1">
            <table className="text-xs border-collapse w-full">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="border border-border px-2 py-1 bg-background/30 text-left font-medium">{children}</th>,
        td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function ThinkingDots() {
  return (
    <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted text-foreground rounded-bl-sm">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

/** Should we show the thinking indicator at the end of this message? */
function shouldShowThinking(segments: MessageSegment[]): boolean {
  if (segments.length === 0) return true; // no content yet
  const last = segments[segments.length - 1];
  // Hide dots only when text is actively being added (user can see streaming text)
  // Show dots in all other cases: waiting for first content, tool in progress, after tool completes
  if (last.type === 'text' && last.text.trim()) return false;
  return true;
}

export function MessageBubble({ role, content, segments, isActive }: MessageBubbleProps) {
  const isUser = role === 'user';

  // User messages: plain text, no segments
  if (isUser) {
    return (
      <div className="flex flex-col gap-1 items-end">
        <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed bg-blue-600 text-white rounded-br-sm">
          {content}
        </div>
      </div>
    );
  }

  // Assistant messages: render segments in order for proper interleaving
  const segs = segments ?? [];
  const showDots = isActive && shouldShowThinking(segs);

  if (segs.length > 0 || showDots) {
    return (
      <div className="flex flex-col gap-1 items-start">
        {segs.map((seg, i) => {
          if (seg.type === 'text' && seg.text.trim()) {
            return (
              <div
                key={i}
                className="max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed bg-muted text-foreground rounded-bl-sm prose prose-sm dark:prose-invert max-w-none"
              >
                <MarkdownContent text={seg.text} />
              </div>
            );
          }
          if (seg.type === 'tool') {
            return (
              <div key={i} className="max-w-[85%] px-1">
                <ToolCallIndicator
                  toolName={seg.toolCall.toolName}
                  args={seg.toolCall.input ?? {}}
                  state={mapToolState(seg.toolCall.state)}
                />
              </div>
            );
          }
          return null;
        })}
        {showDots && <ThinkingDots />}
      </div>
    );
  }

  // Fallback: no segments, just render content
  return (
    <div className="flex flex-col gap-1 items-start">
      {content && (
        <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed bg-muted text-foreground rounded-bl-sm prose prose-sm dark:prose-invert max-w-none">
          <MarkdownContent text={content} />
        </div>
      )}
    </div>
  );
}

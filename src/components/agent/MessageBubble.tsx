import { ToolCallIndicator } from './ToolCallIndicator';

interface ToolInvocation {
  toolName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any;
  state: string;
}

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolInvocation[];
}

export function MessageBubble({ role, content, toolInvocations }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        }`}
      >
        {content}
      </div>
      {toolInvocations && toolInvocations.length > 0 && (
        <div className="max-w-[85%] px-1">
          {toolInvocations.map((invocation, i) => (
            <ToolCallIndicator
              key={i}
              toolName={invocation.toolName}
              args={invocation.args ?? {}}
              state={invocation.state as 'partial-call' | 'call' | 'result'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

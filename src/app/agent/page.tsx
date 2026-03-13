'use client';

import { useAgentStore } from '@/lib/store/agent-store';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ChatInterface } from '@/components/agent/ChatInterface';
import { WidgetGrid } from '@/components/widgets/WidgetGrid';

export default function AgentPage() {
  const clearSession = useAgentStore((s) => s.clearSession);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel: Chat */}
      <div className="w-1/3 border-r flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h2 className="text-sm font-semibold">AI Agent</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSession}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatInterface />
        </div>
      </div>

      {/* Right panel: Widget grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Analysis Workspace</h2>
        </div>
        <WidgetGrid />
      </div>
    </div>
  );
}

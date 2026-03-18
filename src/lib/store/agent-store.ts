import { create } from 'zustand';
import type { WidgetSpec, WidgetData } from '@/lib/agent/types';

interface AgentStore {
  widgets: WidgetSpec[];
  widgetData: Record<string, WidgetData>;
  currentTurnId: string | null;
  addWidget: (spec: WidgetSpec) => void;
  setWidgetData: (id: string, data: WidgetData) => void;
  startTurn: () => string;
  clearSession: () => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  widgets: [],
  widgetData: {},
  currentTurnId: null,

  startTurn: () => {
    const turnId = crypto.randomUUID();
    set({ currentTurnId: turnId });
    return turnId;
  },

  addWidget: (spec) =>
    set((state) => {
      const turnId = spec.turnId ?? state.currentTurnId ?? 'default';
      return {
        widgets: [...state.widgets, { ...spec, turnId }],
        widgetData: {
          ...state.widgetData,
          [spec.id]: { rows: [], isLoading: spec.sql != null, error: null },
        },
      };
    }),

  setWidgetData: (id, data) =>
    set((state) => ({
      widgetData: { ...state.widgetData, [id]: data },
    })),

  clearSession: () => set({ widgets: [], widgetData: {}, currentTurnId: null }),
}));

import { create } from 'zustand';
import type { WidgetSpec, WidgetData } from '@/lib/agent/types';

interface AgentStore {
  widgets: WidgetSpec[];
  widgetData: Record<string, WidgetData>;
  addWidget: (spec: WidgetSpec) => void;
  setWidgetData: (id: string, data: WidgetData) => void;
  clearSession: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  widgets: [],
  widgetData: {},

  addWidget: (spec) =>
    set((state) => ({
      widgets: [...state.widgets, spec],
      widgetData: {
        ...state.widgetData,
        [spec.id]: { rows: [], isLoading: spec.sql != null, error: null },
      },
    })),

  setWidgetData: (id, data) =>
    set((state) => ({
      widgetData: { ...state.widgetData, [id]: data },
    })),

  clearSession: () => set({ widgets: [], widgetData: {} }),
}));

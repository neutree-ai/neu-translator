import type { ModelMessage, ToolCallPart, CopilotRequest } from "core";
import { create } from "zustand";

type Actor = "user" | "agent";

type AgentState = {
  messages: ModelMessage[];
  setMessages: (v: ModelMessage[]) => void;
  addMessages: (v: ModelMessage[]) => void;

  unprocessedToolCalls: ToolCallPart[];
  setUnprocessedToolCalls: (v: ToolCallPart[]) => void;

  currentActor: Actor;
  setCurrentActor: (v: Actor) => void;

  copilotRequest: CopilotRequest | null;
  setCopilotRequest: (v: CopilotRequest | null) => void;
};

export const useAgentStore = create<AgentState>((set) => ({
  messages: [],
  setMessages: (v) => set({ messages: v }),
  addMessages: (v) =>
    set((state) => ({
      messages: state.messages.concat(v),
    })),

  unprocessedToolCalls: [],
  setUnprocessedToolCalls: (v) => set({ unprocessedToolCalls: v }),

  currentActor: "user",
  setCurrentActor: (v) => set({ currentActor: v }),

  copilotRequest: null,
  setCopilotRequest: (v) => set({ copilotRequest: v }),
}));

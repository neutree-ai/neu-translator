import type { CopilotRequest, ModelMessage, ToolCallPart } from "core";
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

  copilotRequests: CopilotRequest[];
  setCopilotRequests: (v: CopilotRequest[]) => void;
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

  copilotRequests: [],
  setCopilotRequests: (v) => set({ copilotRequests: v }),
}));

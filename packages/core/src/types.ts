import type { JSONValue } from "ai";
import type { Memory } from "./memory.js";

export {
  AssistantModelMessage,
  FinishReason,
  ModelMessage,
  SystemModelMessage,
  ToolCallPart,
  ToolModelMessage,
  UserModelMessage,
} from "ai";

export type AgentLoopOptions = {
  abortSignal?: AbortSignal;
  memory?: Memory;
};

export type ToolCallOptions = {
  name: string;
  callId: string;
};

export type NextActor = "user" | "agent";

export type ToolExecutor<TInput = any, UOutput = JSONValue> = (
  input: TInput,
  options: AgentLoopOptions & ToolCallOptions,
  copilotResponse?: CopilotResponse
) => Promise<
  | {
      type: "copilot-request";
      payload: CopilotRequest;
    }
  | {
      type: "tool-result";
      payload: UOutput;
    }
>;

export type CopilotStatus = "approve" | "reject" | "refined";

export type CopilotRequest = {
  tool: ToolCallOptions;
  src_string: string;
  translate_string: string;
  file_id: string;
};

export type CopilotResponse = {
  tool: ToolCallOptions;
  status: CopilotStatus;
  translated_string: string;
  reason: string;
};

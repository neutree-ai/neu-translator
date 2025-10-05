import {
  type FinishReason,
  generateText,
  type ModelMessage,
  type ToolCallPart,
  type ToolResultPart,
  type ToolSet,
  type UserModelMessage,
} from "ai";
import { models } from "./llm.js";
import { Context } from "./context.js";
import type { AgentLoopOptions, NextActor, ToolExecutor } from "./types.js";
import { SYSTEM_WORKFLOW } from "./prompts/system.workflow.js";
import { translateExecutor, translateTool } from "./tools/translate-tool.js";
import { lsExecutor, lsTool } from "./tools/ls-tool.js";
import { readExecutor, readTool } from "./tools/read-tool.js";
import { thinkingExecutor, thinkingTool } from "./tools/thinking-tool.js";

export class AgentLoop {
  private options: AgentLoopOptions;
  private context: Context;
  private toolDefs: ToolSet;
  private toolExecutors: Record<string, ToolExecutor>;

  constructor(options: AgentLoopOptions = {}, messages: ModelMessage[] = []) {
    this.options = options;
    this.context = new Context(messages);
    this.toolDefs = {
      translate: translateTool,
      ls: lsTool,
      read: readTool,
      thinking: thinkingTool,
    };
    this.toolExecutors = {
      translate: translateExecutor,
      ls: lsExecutor,
      read: readExecutor,
      thinking: thinkingExecutor,
    };
  }

  public async next(): Promise<{
    actor: NextActor;
    unprocessedToolCalls: ToolCallPart[];
    messages: ModelMessage[];
    finishReason?: FinishReason;
  }> {
    const { messages, actor, finishReason } = await this._next();
    this.context.addMessages(messages);
    const unprocessedToolCalls = await this.getUnprocessedToolCalls();
    return { actor, unprocessedToolCalls, messages, finishReason };
  }

  public async userInput(messages: UserModelMessage[]) {
    this.context.addMessages(messages);
  }

  public async getMessages(): Promise<ModelMessage[]> {
    return this.context.getMessages();
  }

  public async compact() {
    return await this.context.compact();
  }

  private async _next(): Promise<{
    messages: ModelMessage[];
    actor: NextActor;
    finishReason?: FinishReason;
  }> {
    let actor: NextActor = "agent";

    const modelMessages = this.context.toModelMessages();
    if (modelMessages.length === 0) {
      return {
        messages: [],
        actor: "user",
      };
    }

    const unprocessedToolCalls = await this.getUnprocessedToolCalls();
    if (unprocessedToolCalls.length > 0) {
      const toolResults = await Promise.all(
        unprocessedToolCalls.map((call) => this.executeTool(call))
      );

      return {
        messages: [
          {
            role: "tool",
            content: toolResults,
          },
        ],
        actor: "agent",
      };
    }

    const { response, toolCalls, finishReason } = await generateText({
      system: SYSTEM_WORKFLOW({
        currentMemory: this.options.memory?.provideMemory() || "",
      }),
      model: models.translator,
      messages: modelMessages,
      tools: this.toolDefs,
      abortSignal: this.options.abortSignal,
      experimental_telemetry: { isEnabled: true },
    });

    if (!response.messages.length) {
      return {
        messages: [],
        actor: "user",
        finishReason,
      };
    }

    const lastMessage = response.messages[response.messages.length - 1];
    if (lastMessage.role === "assistant") {
      actor = "user";
    }

    if (toolCalls.length > 0) {
      actor = "agent";
    }

    return {
      messages: response.messages.map((m) => {
        if (m.role === "assistant" && Array.isArray(m.content)) {
          for (const part of m.content) {
            if (part.type === "tool-call") {
              // generate a simple unique id (timestamp + random)
              part.toolCallId = `${Date.now().toString(36)}-${Math.random()
                .toString(36)
                .slice(2, 10)}`;
            }
          }
        }

        return m;
      }),
      actor,
      finishReason,
    };
  }

  private async getUnprocessedToolCalls(): Promise<ToolCallPart[]> {
    const messages = this.context.getMessages();
    const parts: Record<string, ToolCallPart> = {};

    for (const m of messages) {
      if (m.role === "assistant" && Array.isArray(m.content)) {
        for (const part of m.content) {
          if (part.type === "tool-call") {
            if (!parts[part.toolCallId]) {
              parts[part.toolCallId] = part;
            }
          }
        }
      }

      if (m.role === "tool") {
        for (const part of m.content) {
          if (part.type === "tool-result") {
            delete parts[part.toolCallId];
          }
        }
      }
    }

    return Object.values(parts);
  }

  private async executeTool(part: ToolCallPart): Promise<ToolResultPart> {
    const input = part.input as any;
    if (!this.toolExecutors[part.toolName]) {
      throw new Error(`Tool executor not found for: ${part.toolName}`);
    }
    const result = await this.toolExecutors[part.toolName](input, this.options);

    return {
      type: "tool-result",
      toolCallId: part.toolCallId,
      toolName: part.toolName,
      output: {
        type: "json",
        value: result,
      },
    };
  }
}

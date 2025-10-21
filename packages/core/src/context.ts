import { generateText, type ModelMessage } from "ai";
import { models, parseAnalysisSummary } from "./llm.js";
import {
  COMPACT_INSTRUCTION,
  SYSTEM_COMPACT,
} from "./prompts/system.compact.js";
import type { CopilotResponse } from "./types.js";

export class Context<T extends ModelMessage = ModelMessage> {
  private messages: T[] = [];
  private copilotResponses: CopilotResponse[] = [];
  private activeMessages: T[] = [];

  constructor(messages: T[] = []) {
    this.messages = messages.slice();
    this.activeMessages = messages.slice();
  }

  addMessages(messages: T[]) {
    this.messages.push(...messages);
    this.activeMessages.push(...messages);
  }

  addCopilotResponses(responses: CopilotResponse[]) {
    this.copilotResponses.push(...responses);
  }

  getMessages(): T[] {
    return this.messages;
  }

  getCopilotResponses(toolCallIds: string[]): CopilotResponse[] {
    return this.copilotResponses.filter((resp) =>
      toolCallIds.includes(resp.tool.callId)
    );
  }

  toModelMessages(): ModelMessage[] {
    return this.activeMessages;
  }

  async compact() {
    const { text } = await generateText({
      model: models.compactor,
      system: SYSTEM_COMPACT(),
      prompt: [
        ...this.toModelMessages(),
        { role: "user", content: COMPACT_INSTRUCTION() },
      ],
    });

    const { analysis, summary } = parseAnalysisSummary(text);

    this.activeMessages = [
      {
        role: "assistant",
        content: [
          {
            type: "text",
            text: summary.trim(),
          },
        ],
      } as T,
    ];

    return {
      analysis,
      summary,
    };
  }
}

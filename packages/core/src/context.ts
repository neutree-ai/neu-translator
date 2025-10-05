import { generateText, type ModelMessage } from "ai";
import { models, parseAnalysisSummary } from "./llm.js";
import {
  COMPACT_INSTRUCTION,
  SYSTEM_COMPACT,
} from "./prompts/system.compact.js";

export class Context<T extends ModelMessage = ModelMessage> {
  private messages: T[] = [];
  private activeMessages: T[] = [];

  constructor(messages: T[] = []) {
    this.messages = messages.slice();
    this.activeMessages = messages.slice();
  }

  addMessages(messages: T[]) {
    this.messages.push(...messages);
    this.activeMessages.push(...messages);
  }

  getMessages(): T[] {
    return this.messages;
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

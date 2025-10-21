import { readFile, writeFile } from "node:fs/promises";
import { generateText } from "ai";
import { extractJson, models } from "./llm.js";
import { SYSTEM_MEMORY } from "./prompts/system.memory.js";
import type { CopilotRequest, CopilotResponse } from "./types.js";

const persistentFile = "./memory.json";

type MemoryItem = {
  index: number;
  text: string;
  tags: string[];
};

export class Memory {
  current: MemoryItem[] = [];

  async init() {
    try {
      this.current = JSON.parse(await readFile(persistentFile, "utf-8"));
    } catch (error) {
      this.current = [];
    }
  }

  async extractMemory({
    req,
    res,
  }: {
    req: CopilotRequest;
    res: CopilotResponse;
  }) {
    const { text } = await generateText({
      model: models.memory,
      prompt: SYSTEM_MEMORY({
        req,
        res,
        currentMemory: JSON.stringify(this.current),
      }),
    });

    try {
      const output: {
        ops: Array<MemoryItem & { action: "add" | "update" | "delete" }>;
      } = extractJson(text);
      for (const op of output.ops) {
        switch (op.action) {
          case "add":
            this.current.push({
              index: this.current.length,
              text: op.text,
              tags: op.tags,
            });
            break;
          case "delete":
            this.current = this.current.filter(
              (item) => item.index !== op.index
            );
            break;
          case "update": {
            const index = this.current.findIndex(
              (item) => item.index === op.index
            );
            if (index !== -1) {
              this.current[index] = {
                index,
                text: op.text,
                tags: op.tags,
              };
            }
            break;
          }
          default:
        }
      }

      await writeFile(persistentFile, JSON.stringify(this.current, null, 2));
    } catch (error) {
      console.error("Failed to parse memory:", error);
    }
  }

  provideMemory() {
    return this.current
      .map((item) => `${item.text} (${item.tags.join(",")})`)
      .join("\n");
  }
}

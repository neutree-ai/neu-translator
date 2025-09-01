import { generateText } from "ai";
import { writeFile, readFile } from "fs/promises";
import { CopilotRequest, CopilotResponse } from "./types.js";
import { models } from "./llm.js";
import { SYSTEM_MEMORY } from "./prompts/system.memory.js";

const persistentFile = "./memory.txt";

export class Memory {
  current = "";

  async init() {
    try {
      this.current = await readFile(persistentFile, "utf-8");
    } catch (error) {
      this.current = "";
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
        currentMemory: this.current,
      }),
    });

    this.current += `${text}\n`;

    await writeFile(persistentFile, this.current);
  }
}

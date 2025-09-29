import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { getEnvVariable } from "./env.js";

const openrouter = createOpenAICompatible({
  name: "openrouter",
  apiKey: getEnvVariable("OPENROUTER_API_KEY"),
  baseURL: `https://openrouter.ai/api/v1`,
});

export const models = {
  translator: openrouter("google/gemini-2.5-flash"),
  memory: openrouter("google/gemini-2.5-flash-lite"),
  compactor: openrouter("google/gemini-2.5-flash-lite"),
};

export const extractJson = (output: string) => {
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      return null;
    }
  }
};

function extractTagContent(input: string, tag: string): string {
  const openRe = new RegExp(`<${tag}(?=\\s|>)\\b[^>]*>`, "gi");
  const closeRe = new RegExp(`</${tag}\\s*>`, "gi");

  const firstOpen = openRe.exec(input);
  if (!firstOpen) return "";

  const startIdx = firstOpen.index;
  const startEnd = openRe.lastIndex;
  let depth = 1;

  while (true) {
    const nextOpen = openRe.exec(input);
    const nextClose = closeRe.exec(input);

    if (!nextClose) return "";

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++;
      continue;
    } else {
      depth--;
      if (depth === 0) {
        const endIdx = nextClose.index;
        return input.slice(startEnd, endIdx).trim();
      }
      continue;
    }
  }
}

export function parseAnalysisSummary(input: string): {
  analysis: string;
  summary: string;
} {
  const analysis = extractTagContent(input, "analysis");
  const summary = extractTagContent(input, "summary");
  return { analysis, summary };
}

import { ModelMessage } from "core";
import { useMemo } from "react";

export const useTranslationState = (messages: ModelMessage[]) => {
  const { currentFile, currentTranslation } = useMemo(() => {
    let currentFile: string | null = null;
    const currentTranslation = {
      src: "",
      translated: "",
    };

    const translatedCalls = new Map<string, string>();

    for (const m of messages) {
      if (m.role === "tool") {
        for (const part of m.content) {
          const toolName = part.toolName.toLowerCase();
          if (toolName === "read") {
            const value = part.output.value as { content: string };
            currentFile = value.content;
            currentTranslation.translated = currentFile;
          }

          if (toolName === "translate") {
            const { translated_string, status } = part.output.value as {
              translated_string: string;
              status: string;
            };
            if (status !== "rejected") {
              translatedCalls.set(part.toolCallId, translated_string);
            }
          }
        }
      }
    }

    for (const m of messages) {
      if (m.role === "assistant" && Array.isArray(m.content)) {
        for (const part of m.content) {
          if (part.type === "tool-call") {
            const toolName = part.toolName.toLowerCase();

            if (
              toolName === "translate" &&
              translatedCalls.has(part.toolCallId) &&
              currentFile
            ) {
              const { src_string } = part.input as { src_string: string };
              const prunedSrc = currentFile.replace(currentTranslation.src, "");
              const startIndex = prunedSrc.indexOf(src_string);
              if (startIndex > 0) {
                const gap = prunedSrc.slice(0, startIndex);
                // if gap is all whitespaces, append to src_string manually
                if (gap.trim().length === 0) {
                  currentTranslation.src += gap;
                }
              }
              currentTranslation.src += src_string;

              currentTranslation.translated =
                currentTranslation.translated.replace(
                  src_string,
                  translatedCalls.get(part.toolCallId)!
                );
            }
          }
        }
      }
    }

    return {
      currentFile,
      currentTranslation,
    };
  }, [messages]);

  return {
    currentFile,
    currentTranslation,
  };
};

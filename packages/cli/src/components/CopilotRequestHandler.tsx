import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { edit } from "external-editor";
import { Select } from "@inkjs/ui";
import { CopilotRequest, CopilotResponse } from "core";

type CopilotRequestHandlerProps = {
  copilotRequest: CopilotRequest;
  copilotResolverRef: React.RefObject<
    null | ((value: CopilotResponse | PromiseLike<CopilotResponse>) => void)
  >;
  withEditor: (fn: () => string) => Promise<string>;
  onFinish: () => void;
  currentFile: string | null;
  currentTranslation: {
    src: string;
    translated: string;
  };
};

// Helper function to truncate text and show context around target
const getContextualDisplay = (
  fullText: string,
  srcString: string,
  currentTranslationSrc: string,
  contextSize: number = 100
) => {
  const srcIndex = fullText.indexOf(srcString);
  if (srcIndex === -1) {
    return {
      beforeText: "...",
      srcText: srcString,
      afterText: "...",
      hasGap: true,
      gapText: "src_string not found in file",
    };
  }

  const beforeSrc = fullText.slice(0, srcIndex);
  const afterSrc = fullText.slice(srcIndex + srcString.length);

  // Check if translation is coherent (current translation matches the beginning)
  const isCoherent = beforeSrc.startsWith(currentTranslationSrc);

  let displayBefore = "";
  let hasGap = false;
  let gapText = "";

  if (isCoherent) {
    if (beforeSrc.length > contextSize) {
      displayBefore = "..." + beforeSrc.slice(-contextSize);
    } else {
      displayBefore = beforeSrc;
    }
  } else {
    // There's a gap - show it in red
    hasGap = true;
    if (beforeSrc.length <= currentTranslationSrc.length) {
      gapText = beforeSrc;
      displayBefore = "";
    } else {
      gapText = beforeSrc.slice(currentTranslationSrc.length);
      const availableSpace = Math.min(
        currentTranslationSrc.length,
        contextSize
      );
      displayBefore = currentTranslationSrc.slice(-availableSpace);
    }
  }

  // Show first 50 chars after src_string
  const displayAfter =
    afterSrc.length > contextSize
      ? afterSrc.slice(0, contextSize) + "..."
      : afterSrc;

  return {
    beforeText: displayBefore,
    srcText: srcString,
    afterText: displayAfter,
    hasGap,
    gapText,
  };
};

function countOccurrences(str: string, sub: string) {
  if (sub === "") return 0;
  return str.split(sub).length - 1;
}

export const CopilotRequestHandler = ({
  copilotRequest,
  copilotResolverRef,
  withEditor,
  onFinish,
  currentFile,
  currentTranslation,
}: CopilotRequestHandlerProps) => {
  const [invalid, setInvalid] = useState("");

  useEffect(() => {
    if (!currentFile) {
      setInvalid("No file selected");
      return;
    }

    const matches = countOccurrences(currentFile, copilotRequest.src_string);

    if (matches === 0) {
      setInvalid("Source string not found in file");
      return;
    }

    if (matches > 1) {
      setInvalid("Source string is not unique in file");
      return;
    }
  }, [currentFile, copilotRequest]);

  useEffect(() => {
    if (invalid) {
      copilotResolverRef.current?.({
        status: "reject",
        translated_string: "",
        reason: invalid,
      });

      onFinish();
    }
  }, [invalid]);

  if (!currentFile) {
    return <Text color="red">No file selected</Text>;
  }

  if (invalid) {
    return <Text color="red">Invalid copilot request: {invalid}</Text>;
  }

  const contextDisplay = getContextualDisplay(
    currentFile,
    copilotRequest.src_string,
    currentTranslation.src
  );

  return (
    <Box flexDirection="column">
      <Box>
        <Box borderStyle="single" width="50%" flexDirection="column">
          {contextDisplay.beforeText && (
            <Text color="gray">{contextDisplay.beforeText}</Text>
          )}
          {contextDisplay.hasGap && (
            <Text color="red">{contextDisplay.gapText}</Text>
          )}
          <Text color="blue">{contextDisplay.srcText}</Text>
          {contextDisplay.afterText && (
            <Text color="gray">{contextDisplay.afterText}</Text>
          )}
        </Box>
        <Box borderStyle="single" width="50%">
          <Text color="green">{copilotRequest.translate_string}</Text>
        </Box>
      </Box>
      <Select
        options={[
          {
            label: "Approve",
            value: "approve",
          },
          {
            label: "Reject",
            value: "reject",
          },
          {
            label: "Refine",
            value: "refine",
          },
        ]}
        onChange={async (value) => {
          try {
            switch (value) {
              case "approve":
                copilotResolverRef.current?.({
                  status: "approve",
                  translated_string: copilotRequest.translate_string,
                  reason: "",
                });
                break;
              case "reject": {
                const reason = await withEditor(() =>
                  edit("# Please provide a reason for rejection:")
                );

                copilotResolverRef.current?.({
                  status: "reject",
                  translated_string: "",
                  reason: reason
                    .split("\n")
                    .filter((line) => line.trim() && !line.startsWith("#"))
                    .join("\n"),
                });
                break;
              }
              case "refine": {
                const refined = await withEditor(() =>
                  edit(copilotRequest.translate_string)
                );
                copilotResolverRef.current?.({
                  status: "refined",
                  translated_string: refined,
                  reason: "",
                });
                break;
              }
              default:
            }
          } finally {
            onFinish();
          }
        }}
      />
    </Box>
  );
};

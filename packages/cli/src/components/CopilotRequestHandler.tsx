import { Select } from "@inkjs/ui";
import type { CopilotRequest, CopilotResponse, ModelMessage } from "core";
import { edit } from "external-editor";
import { Box, Text } from "ink";
import React from "react";
import { useEffect, useState } from "react";
import {
  countOccurrences,
  getContextualDisplay,
  useTranslationState,
} from "react-shared";

type CopilotRequestHandlerProps = {
  copilotRequest: CopilotRequest;
  copilotResolverRef: React.RefObject<
    null | ((value: CopilotResponse | PromiseLike<CopilotResponse>) => void)
  >;
  withEditor: (fn: () => string) => Promise<string>;
  onFinish: () => void;
  messages: ModelMessage[];
};

export const CopilotRequestHandler = ({
  copilotRequest,
  copilotResolverRef,
  withEditor,
  onFinish,
  messages,
}: CopilotRequestHandlerProps) => {
  const [invalid, setInvalid] = useState("");

  const { currentFile, currentTranslation } = useTranslationState(messages);

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
  }, [invalid, onFinish, copilotResolverRef.current]);

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

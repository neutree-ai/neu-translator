import { Select } from "@inkjs/ui";
import type { CopilotRequest, CopilotResponse, ModelMessage } from "core";
import { edit } from "external-editor";
import { Box, Text } from "ink";
import React, { useCallback, useEffect, useState } from "react";
import {
  countOccurrences,
  getContextualDisplay,
  useTranslationState,
} from "react-shared";

type CopilotRequestHandlerProps = {
  copilotRequests: CopilotRequest[];
  withEditor: (fn: () => string) => Promise<string>;
  onFinish: (copilotResponses: CopilotResponse[]) => void;
  messages: ModelMessage[];
};

export const CopilotRequestHandler = ({
  copilotRequests,
  withEditor,
  onFinish,
  messages,
}: CopilotRequestHandlerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<CopilotResponse[]>([]);
  const [invalid, setInvalid] = useState("");

  const copilotRequest = copilotRequests[currentIndex];

  const { currentFile, currentTranslation } = useTranslationState(messages);

  // Initialize state when copilotRequest changes
  useEffect(() => {
    if (copilotRequest) {
      setInvalid("");
    }
  }, [copilotRequest]);

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

  const handleResponse = useCallback(
    (response: CopilotResponse) => {
      const updatedResponses = [...responses, response];
      setResponses(updatedResponses);

      // Check if there are more requests to process
      if (currentIndex < copilotRequests.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // All requests processed, call onFinish with all responses
        onFinish(updatedResponses);
      }
    },
    [responses, currentIndex, copilotRequests.length, onFinish]
  );

  useEffect(() => {
    if (invalid) {
      handleResponse({
        tool: copilotRequest.tool,
        status: "reject",
        translated_string: "",
        reason: invalid,
      });
    }
  }, [invalid, copilotRequest, handleResponse]);

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
      {copilotRequests.length > 1 && (
        <Box marginBottom={1}>
          <Text color="cyan">
            Processing {currentIndex + 1} of {copilotRequests.length} requests
          </Text>
        </Box>
      )}
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
          switch (value) {
            case "approve":
              handleResponse({
                tool: copilotRequest.tool,
                status: "approve",
                translated_string: copilotRequest.translate_string,
                reason: "",
              });
              break;
            case "reject": {
              const reason = await withEditor(() =>
                edit("# Please provide a reason for rejection:")
              );

              handleResponse({
                tool: copilotRequest.tool,
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
              handleResponse({
                tool: copilotRequest.tool,
                status: "refined",
                translated_string: refined,
                reason: "",
              });
              break;
            }
            default:
          }
        }}
      />
    </Box>
  );
};

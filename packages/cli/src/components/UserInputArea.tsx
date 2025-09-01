import React from "react";
import { ToolCallPart } from "core";
import { Box } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";

export const UserInputArea = ({
  currentActor,
  onSubmit,
  unprocessedToolCalls,
}: {
  currentActor: string;
  onSubmit: (input: string) => void;
  unprocessedToolCalls: ToolCallPart[];
}) => {
  if (currentActor !== "user") {
    return (
      <Box borderStyle="single" borderTop flexDirection="column">
        <Spinner label="Processing... (Press ESC to stop)" />
        <Box>
          {unprocessedToolCalls.map((part, index) => {
            return (
              <Box marginRight={1} key={index}>
                <Spinner label={`calling ${part.toolName}`} type="aesthetic" />
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  }

  return (
    <Box borderStyle="single" borderTop>
      <TextInput placeholder="Enter your prompt..." onSubmit={onSubmit} />
    </Box>
  );
};

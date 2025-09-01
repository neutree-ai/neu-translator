import React from "react";
import { ModelMessage, ToolCallPart } from "core";
import { Box } from "ink";
import { Message } from "./Message.js";

export const MessagesList = ({
  messages,
  unprocessedToolCalls,
}: {
  messages: ModelMessage[];
  unprocessedToolCalls: ToolCallPart[];
}) => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      {messages.map((message, index) => (
        <Message
          message={message}
          unprocessedToolCalls={unprocessedToolCalls}
          key={index}
        />
      ))}
    </Box>
  );
};

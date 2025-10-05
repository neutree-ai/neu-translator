import React from "react";
import { ToolCallPart, type ModelMessage } from "core";
import { Text, Box } from "ink";
import * as yaml from "js-yaml";
import { unifyParts, truncateValue } from "react-shared";

export const Message = ({
  message,
  unprocessedToolCalls,
}: {
  message: ModelMessage;
  unprocessedToolCalls: ToolCallPart[];
}) => {
  return (
    <Box flexDirection="column">
      <Text color={message.role === "user" ? "cyan" : "yellow"}>
        {message.role}
        {`: `}
      </Text>
      {unifyParts(message.content).map((part, index) => {
        switch (part.type) {
          case "text":
            return <Text key={index}>{part.text.trim()}</Text>;
          case "reasoning":
            return (
              <Text key={index} color="grey" italic>
                {part.text}
              </Text>
            );
          case "tool-call":
            return unprocessedToolCalls.some(
              (c) => c.toolCallId === part.toolCallId
            ) ? (
              <Box key={index} borderStyle="single" flexDirection="column">
                <Text color="yellow">{part.toolName} calling</Text>
                <Text color="gray">
                  {yaml.dump(truncateValue(part.input), {
                    indent: 2,
                    lineWidth: 80,
                    noRefs: true,
                    sortKeys: false,
                  })}
                </Text>
              </Box>
            ) : null;
          case "tool-result":
            return (
              <Box key={index} borderStyle="single" flexDirection="column">
                <Text color="green">{part.toolName} done</Text>
                {part.output.type === "json" && part.output.value && (
                  <Text color="gray">
                    {yaml.dump(truncateValue(part.output.value), {
                      indent: 2,
                      lineWidth: 80,
                      noRefs: true,
                      sortKeys: false,
                    })}
                  </Text>
                )}
              </Box>
            );
          case "image":
            return (
              <Text key={index} color="red">
                [Image]
              </Text>
            );
          case "file":
            return (
              <Text key={index} color="red">
                [File]
              </Text>
            );
          default:
            return null;
        }
      })}
    </Box>
  );
};

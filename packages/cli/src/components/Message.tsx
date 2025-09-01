import React from "react";
import { ToolCallPart, type ModelMessage } from "core";
import { Text, Box } from "ink";
import * as yaml from "js-yaml";

const truncateValue = (value: any): any => {
  if (typeof value === "string" && value.length > 50) {
    return value.substring(0, 50) + "...";
  }

  if (Array.isArray(value)) {
    return value.map(truncateValue);
  }

  if (typeof value === "object" && value !== null) {
    const truncated: any = {};
    for (const [key, val] of Object.entries(value)) {
      truncated[key] = truncateValue(val);
    }
    return truncated;
  }

  return value;
};

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
      <>
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
      </>
    </Box>
  );
};

function unifyParts(
  content: ModelMessage["content"]
): Exclude<ModelMessage["content"], string> {
  if (typeof content === "string") {
    return [
      {
        type: "text",
        text: content,
      },
    ];
  }

  return content.slice().sort((a, b) => {
    // reasoning first
    if (a.type === "reasoning" && b.type !== "reasoning") {
      return -1;
    }
    if (a.type !== "reasoning" && b.type === "reasoning") {
      return 1;
    }
    return 0;
  });
}

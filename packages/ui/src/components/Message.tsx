import type { ModelMessage, ToolCallPart } from "core";
import * as yaml from "js-yaml";
import React from "react";
import { truncateValue, unifyParts } from "react-shared";
import {
  Message as _Message,
  MessageContent,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
  ToolInput,
} from "@/components/ai-elements/tool";

export const Message = ({
  message,
  unprocessedToolCalls,
}: {
  message: ModelMessage;
  unprocessedToolCalls: ToolCallPart[];
}) => {
  return (
    <div className="flex flex-col">
      {unifyParts(message.content).map((part, index) => {
        switch (part.type) {
          case "text":
            return (
              <_Message key={index} from={message.role as "user" | "assistant"}>
                <MessageContent>{part.text.trim()}</MessageContent>
              </_Message>
            );
          case "reasoning":
            return (
              <Reasoning className="w-full" isStreaming={false} key={index}>
                <ReasoningTrigger />
                <ReasoningContent>{part.text}</ReasoningContent>
              </Reasoning>
            );
          case "tool-call":
            return unprocessedToolCalls.some(
              (c) => c.toolCallId === part.toolCallId
            ) ? (
              <Tool key={index} defaultOpen>
                <ToolHeader
                  type="tool-call"
                  state="input-available"
                  title={part.toolName}
                />
                <ToolContent>
                  <ToolInput
                    input={yaml.dump(truncateValue(part.input), {
                      indent: 2,
                      lineWidth: 80,
                      noRefs: true,
                      sortKeys: false,
                    })}
                  />
                </ToolContent>
              </Tool>
            ) : null;
          case "tool-result":
            return (
              <Tool key={index} defaultOpen>
                <ToolHeader
                  type="tool-call"
                  state="output-available"
                  title={part.toolName}
                />
                <ToolContent>
                  <ToolOutput
                    errorText=""
                    output={yaml.dump(truncateValue(part.output.value), {
                      indent: 2,
                      lineWidth: 80,
                      noRefs: true,
                      sortKeys: false,
                    })}
                  />
                </ToolContent>
              </Tool>
            );
          case "image":
            return (
              <div key={index} className="text-red-600">
                [Image]
              </div>
            );
          case "file":
            return (
              <div key={index} className="text-red-600">
                [File]
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

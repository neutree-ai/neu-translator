import type { ToolCallPart } from "core";
import React, { useState } from "react";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";

export const UserInputArea = ({
  currentActor,
  onSubmit,
  unprocessedToolCalls,
  stop,
}: {
  currentActor: string;
  onSubmit: (input: string) => void;
  unprocessedToolCalls: ToolCallPart[];
  stop: () => void;
}) => {
  const [input, setInput] = useState("");

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    onSubmit(message.text ?? "");
    setInput("");
  };

  return (
    <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
      <PromptInputBody>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
        <PromptInputTextarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder={
            currentActor === "user"
              ? "Input your task here ..."
              : "Processing..."
          }
          disabled={currentActor === "agent"}
        />
      </PromptInputBody>
      <PromptInputToolbar>
        <PromptInputTools>
          <div>
            {unprocessedToolCalls.map((part, index) => {
              return (
                <div className="mr-1" key={index}>
                  calling {part.toolName}
                </div>
              );
            })}
          </div>
        </PromptInputTools>
        <PromptInputSubmit
          status={currentActor === "user" ? "ready" : "streaming"}
          onClick={currentActor === "agent" ? stop : undefined}
        />
      </PromptInputToolbar>
    </PromptInput>
  );
};

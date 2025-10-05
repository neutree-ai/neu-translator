import type { ModelMessage, ToolCallPart } from "core";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Message } from "./Message";

export const MessageList = ({
  messages,
  unprocessedToolCalls,
  currentActor,
}: {
  messages: ModelMessage[];
  unprocessedToolCalls: ToolCallPart[];
  currentActor: string;
}) => {
  return (
    <Conversation className="h-full">
      <ConversationContent>
        {messages.map((message, index) => (
          <Message
            message={message}
            unprocessedToolCalls={unprocessedToolCalls}
            key={index}
          />
        ))}
        {currentActor === "agent" && <Loader />}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
};

import { metricsSdk } from "core";
import { Box, render, useInput } from "ink";
import React from "react";
import { CopilotRequestHandler } from "./components/CopilotRequestHandler.js";
import { Command } from "./components/commands/Command.js";
import { Hello } from "./components/Hello.js";
import { MessagesList } from "./components/MessageList.js";
import { UserInputArea } from "./components/UserInputArea.js";
import { useAgent } from "./hooks/use-agent.js";
import { useEditor } from "./hooks/use-editor.js";
import { useUserInput } from "./hooks/use-user-input.js";

metricsSdk.start();

const TUIApp = () => {
  const {
    // agent state
    messages,
    currentActor,
    unprocessedToolCalls,

    // user interactions
    submitAgent,
    stop,

    // copilot interactions
    copilotRequests,
    finishCopilotRequest,
  } = useAgent();

  const { isEditing, withEditor } = useEditor();

  const { handleUserInput, cmd, exitCmd } = useUserInput({
    submitAgent,
  });

  useInput((_, key) => {
    if (isEditing) {
      return;
    }

    if (cmd.value) {
      return;
    }

    if (key.escape) {
      stop();
    }
  });

  if (isEditing) {
    return null;
  }

  if (copilotRequests.length > 0) {
    return (
      <CopilotRequestHandler
        copilotRequests={copilotRequests}
        withEditor={withEditor}
        onFinish={finishCopilotRequest}
        messages={messages}
      />
    );
  }

  if (cmd.value) {
    return <Command cmd={cmd} exitCmd={exitCmd} />;
  }

  return (
    <Box flexDirection="column">
      {messages.length === 0 ? (
        <Hello />
      ) : (
        <MessagesList
          messages={messages}
          unprocessedToolCalls={unprocessedToolCalls}
        />
      )}

      <UserInputArea
        currentActor={currentActor}
        onSubmit={handleUserInput}
        unprocessedToolCalls={unprocessedToolCalls}
      />
    </Box>
  );
};

export function renderApp() {
  render(<TUIApp />);
}

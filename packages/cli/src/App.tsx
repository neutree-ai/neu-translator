import React from "react";
import { render, Box, useInput } from "ink";
import { metricsSdk } from "core";
import { Hello } from "./components/Hello.js";
import { CopilotRequestHandler } from "./components/CopilotRequestHandler.js";
import { UserInputArea } from "./components/UserInputArea.js";
import { MessagesList } from "./components/MessageList.js";
import { useAgent } from "./hooks/use-agent.js";
import { useEditor } from "./hooks/use-editor.js";
import { useUserInput } from "./hooks/use-user-input.js";
import { Command } from "./components/commands/Command.js";

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
    copilotRequest,
    finishCopilotRequest,
    copilotResolverRef,
  } = useAgent();

  const { isEditing, withEditor } = useEditor();
  useInput((_, key) => {
    if (isEditing) {
      return;
    }

    if (key.escape) {
      stop();
    }
  });

  const { handleUserInput, cmd, exitCmd } = useUserInput({
    submitAgent,
  });

  if (isEditing) {
    return null;
  }

  if (copilotRequest) {
    return (
      <CopilotRequestHandler
        copilotRequest={copilotRequest}
        copilotResolverRef={copilotResolverRef}
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

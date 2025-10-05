"use client";

import { CopilotRequestHandler } from "@/components/CopilotRequestHandler";
import Hello from "@/components/Hello";
import { MessageList } from "@/components/MessageList";
import { UserInputArea } from "@/components/UserInputArea";
import { useAgent } from "./hooks/use-agent";

const Inner = () => {
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
  } = useAgent();

  if (copilotRequest) {
    return (
      <CopilotRequestHandler
        copilotRequest={copilotRequest}
        messages={messages}
        onFinish={finishCopilotRequest}
      />
    );
  }

  // TODO: port command

  return (
    <div className="flex flex-col h-full">
      {messages.length === 0 ? (
        <div className="flex-1">
          <Hello />
        </div>
      ) : (
        <MessageList
          messages={messages}
          currentActor={currentActor}
          unprocessedToolCalls={unprocessedToolCalls}
        />
      )}

      <UserInputArea
        currentActor={currentActor}
        onSubmit={submitAgent}
        unprocessedToolCalls={unprocessedToolCalls}
        stop={stop}
      />
    </div>
  );
};

const App = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 relative size-full h-screen">
      <Inner />
    </div>
  );
};

export default App;

"use client";

import { CopilotRequestHandler } from "@/components/CopilotRequestHandler";
import Hello from "@/components/Hello";
import { MessageList } from "@/components/MessageList";
import { SessionSidebar } from "@/components/SessionSidebar";
import { UserInputArea } from "@/components/UserInputArea";
import { useState } from "react";
import { useAgent } from "./hooks/use-agent";

const Inner = () => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

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

    // session management
    loadSession,
    resetSession,
  } = useAgent();

  const handleSelectSession = (sessionId: string | null) => {
    setSelectedSessionId(sessionId);
    if (sessionId === null) {
      resetSession();
    } else {
      loadSession(sessionId);
    }
  };

  if (copilotRequests.length > 0) {
    return (
      <CopilotRequestHandler
        copilotRequests={copilotRequests}
        messages={messages}
        onFinish={finishCopilotRequest}
      />
    );
  }

  // TODO: port command

  return (
    <>
      <SessionSidebar
        currentSessionId={selectedSessionId}
        onSelectSession={handleSelectSession}
      />
      <div className="flex flex-col h-full flex-1">
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
    </>
  );
};

const App = () => {
  return (
    <div className="flex h-screen">
      <Inner />
    </div>
  );
};

export default App;

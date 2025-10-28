import type { CopilotResponse } from "core";
import { createRef, useEffect } from "react";
import { useAgentStore } from "react-shared";
import type { AgentResponse } from "../api/next/route";

const sessionIdRef = createRef<string>();
sessionIdRef.current = null;

const runningRef = createRef<boolean>();
runningRef.current = false;

const abortController = createRef<AbortController | null>();
abortController.current = null;

// TODO: port memory

export const useAgent = (initialSessionId?: string) => {
  const messages = useAgentStore((s) => s.messages);
  const addMessages = useAgentStore((s) => s.addMessages);
  const setMessages = useAgentStore((s) => s.setMessages);

  const unprocessedToolCalls = useAgentStore((s) => s.unprocessedToolCalls);
  const setUnprocessedToolCalls = useAgentStore(
    (s) => s.setUnprocessedToolCalls,
  );

  const currentActor = useAgentStore((s) => s.currentActor);
  const setCurrentActor = useAgentStore((s) => s.setCurrentActor);

  const copilotRequests = useAgentStore((s) => s.copilotRequests);
  const setCopilotRequests = useAgentStore((s) => s.setCopilotRequests);

  const doNext = async (
    params:
      | { type: "userInput"; input: string }
      | { type: "copilot"; responses: CopilotResponse[] },
  ) => {
    setCurrentActor("agent");

    let round = 1;

    while (runningRef.current) {
      try {
        const body = {
          sessionId: sessionIdRef.current,
        };
        if (round === 1) {
          Object.assign(body, {
            userInput: params.type === "userInput" ? params.input : undefined,
            copilotResponses:
              params.type === "copilot" ? params.responses : undefined,
          });
        }

        const { sessionId, agentResponse } = await fetch("/api/next", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: abortController.current?.signal,
        }).then(
          (res) =>
            res.json() as Promise<{
              sessionId: string;
              agentResponse: AgentResponse;
            }>,
        );

        round++;

        sessionIdRef.current = sessionId;

        if (
          agentResponse.copilotRequests &&
          agentResponse.copilotRequests.length > 0
        ) {
          setCopilotRequests(agentResponse.copilotRequests);
          break;
        } else {
          setCurrentActor(agentResponse.actor);

          addMessages(agentResponse.messages);

          setUnprocessedToolCalls(agentResponse.unprocessedToolCalls);

          if (agentResponse.actor === "user") {
            break;
          }
        }
      } catch (error) {
        const isAbortError =
          error instanceof Error && error.name === "AbortError";
        if (!isAbortError) {
          console.error("Error in agent loop:", error);
        }
        runningRef.current = false;
        setCurrentActor("user");
        break;
      }
    }
  };

  const submitAgent = async (input: string) => {
    runningRef.current = true;

    addMessages([
      {
        role: "user",
        content: [
          {
            type: "text",
            text: input,
          },
        ],
      },
    ]);

    await doNext({
      type: "userInput",
      input,
    });
  };

  const finishCopilotRequest = async (copilotResponses: CopilotResponse[]) => {
    setCopilotRequests([]);
    await doNext({
      type: "copilot",
      responses: copilotResponses,
    });
  };

  const stop = () => {
    runningRef.current = false;
    abortController.current?.abort();
    setCurrentActor("user");
  };

  const loadSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) {
        console.error("Failed to load session:", sessionId);
        return;
      }
      const data = await response.json();
      const session = data.session;

      sessionIdRef.current = sessionId;
      setMessages(session.messages);
      setCurrentActor("user");
      setUnprocessedToolCalls([]);
      setCopilotRequests([]);
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  const resetSession = () => {
    sessionIdRef.current = null;
    setMessages([]);
    setCurrentActor("user");
    setUnprocessedToolCalls([]);
    setCopilotRequests([]);
  };

  // biome-ignore lint: by design
  useEffect(() => {
    if (initialSessionId) {
      loadSession(initialSessionId);
    }
  }, [initialSessionId]);

  // TODO: port compact

  return {
    messages,
    currentActor,
    unprocessedToolCalls,
    copilotRequests,
    submitAgent,
    finishCopilotRequest,
    stop,
    loadSession,
    resetSession,
  };
};

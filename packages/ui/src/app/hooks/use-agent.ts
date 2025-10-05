import type { CopilotResponse } from "core";
import { createRef } from "react";
import { useAgentStore } from "react-shared";
import type { AgentResponse } from "../api/next/route";

const sessionIdRef = createRef<string>();
sessionIdRef.current = null;

const runningRef = createRef<boolean>();
runningRef.current = false;

const abortController = createRef<AbortController | null>();
abortController.current = null;

// TODO: port memory

export const useAgent = () => {
  const messages = useAgentStore((s) => s.messages);
  const addMessages = useAgentStore((s) => s.addMessages);

  const unprocessedToolCalls = useAgentStore((s) => s.unprocessedToolCalls);
  const setUnprocessedToolCalls = useAgentStore(
    (s) => s.setUnprocessedToolCalls
  );

  const currentActor = useAgentStore((s) => s.currentActor);
  const setCurrentActor = useAgentStore((s) => s.setCurrentActor);

  const copilotRequest = useAgentStore((s) => s.copilotRequest);
  const setCopilotRequest = useAgentStore((s) => s.setCopilotRequest);

  const doNext = async (
    params:
      | { type: "userInput"; input: string }
      | { type: "copilot"; response: CopilotResponse }
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
            copilotResponse:
              params.type === "copilot" ? params.response : undefined,
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
            }>
        );

        round++;

        sessionIdRef.current = sessionId;

        if (agentResponse.type === "copilot") {
          setCopilotRequest(agentResponse.result);
          break;
        } else {
          setCurrentActor(agentResponse.result.actor);

          addMessages(agentResponse.result.messages);

          setUnprocessedToolCalls(agentResponse.result.unprocessedToolCalls);

          if (agentResponse.result.actor === "user") {
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

  const finishCopilotRequest = async (copilotResponse: CopilotResponse) => {
    setCopilotRequest(null);
    await doNext({
      type: "copilot",
      response: copilotResponse,
    });
  };

  const stop = () => {
    runningRef.current = false;
    abortController.current?.abort();
    setCurrentActor("user");
  };

  // TODO: port compact

  return {
    messages,
    currentActor,
    unprocessedToolCalls,
    copilotRequest,
    submitAgent,
    finishCopilotRequest,
    stop,
  };
};

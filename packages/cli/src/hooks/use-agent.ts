import { AgentLoop, type CopilotResponse, Memory } from "core";
import { createRef, useCallback } from "react";
import { useAgentStore } from "react-shared";

const agentLoopRef = createRef<AgentLoop>();
agentLoopRef.current = null;

const runningRef = createRef<boolean>();
runningRef.current = false;

const memoryRef = createRef<Memory>();
memoryRef.current = new Memory();

const abortController = createRef<AbortController | null>();
abortController.current = null;

export const useAgent = () => {
  const messages = useAgentStore((s) => s.messages);
  const setMessages = useAgentStore((s) => s.setMessages);

  const unprocessedToolCalls = useAgentStore((s) => s.unprocessedToolCalls);
  const setUnprocessedToolCalls = useAgentStore(
    (s) => s.setUnprocessedToolCalls
  );

  const currentActor = useAgentStore((s) => s.currentActor);
  const setCurrentActor = useAgentStore((s) => s.setCurrentActor);

  const copilotRequests = useAgentStore((s) => s.copilotRequests);
  const setCopilotRequests = useAgentStore((s) => s.setCopilotRequests);

  const initAgentLoop = useCallback(async () => {
    if (!agentLoopRef.current) {
      abortController.current = new AbortController();

      await memoryRef.current?.init();

      agentLoopRef.current = new AgentLoop({
        abortSignal: abortController.current.signal,
        memory: memoryRef.current!,
      });

      process.addListener("SIGINT", () => {
        runningRef.current = false;
        abortController.current?.abort();
        process.exit(0);
      });
    }
  }, []);

  const doNext = useCallback(async () => {
    if (!agentLoopRef.current) {
      await initAgentLoop();
    }

    setCurrentActor("agent");

    while (runningRef.current && agentLoopRef.current) {
      try {
        const agentResponse = await agentLoopRef.current.next();

        if (agentResponse.copilotRequests.length > 0) {
          setCopilotRequests(agentResponse.copilotRequests);
          break;
        }

        setCurrentActor(agentResponse.actor);

        const newMessages = await agentLoopRef.current.getMessages();
        setMessages(newMessages.slice());

        setUnprocessedToolCalls(agentResponse.unprocessedToolCalls);

        if (agentResponse.actor === "user") {
          break;
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
  }, [
    initAgentLoop,
    setCurrentActor,
    setMessages,
    setUnprocessedToolCalls,
    setCopilotRequests,
  ]);

  const submitAgent = async (input: string) => {
    runningRef.current = true;

    if (!agentLoopRef.current) {
      await initAgentLoop();
    }

    await agentLoopRef.current?.userInput([
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

    const newMessages = await agentLoopRef.current?.getMessages();
    if (newMessages) {
      setMessages(newMessages.slice());
    }

    await doNext();
  };

  const finishCopilotRequest = async (copilotResponses: CopilotResponse[]) => {
    setCopilotRequests([]);
    agentLoopRef.current?.addCopilotResponses(copilotResponses);

    await doNext();
  };

  const stop = () => {
    runningRef.current = false;
    abortController.current?.abort();
    setCurrentActor("user");
  };

  const compact = useCallback(async () => {
    if (!agentLoopRef.current) {
      return;
    }

    return agentLoopRef.current.compact();
  }, []);

  return {
    messages,
    currentActor,
    unprocessedToolCalls,
    submitAgent,
    copilotRequests,
    finishCopilotRequest,
    stop,
    memoryRef: memoryRef,
    compact,
  };
};

import {
  AgentLoop,
  UserModelMessage,
  type CopilotRequest,
  type CopilotResponse,
} from "core";
import { SessionManager } from "@/app/lib/storage";

const sessionManager = new SessionManager();

export type AgentResponse =
  | {
      type: "normal";
      result: Awaited<ReturnType<AgentLoop["next"]>>;
    }
  | {
      type: "copilot";
      result: CopilotRequest;
    };

export async function POST(req: Request) {
  const {
    copilotResponse,
    sessionId,
    userInput,
  }: {
    sessionId?: string;
    userInput?: string;
    copilotResponse?: CopilotResponse;
  } = await req.json();

  const session = sessionId
    ? sessionManager.getSession(sessionId)
    : sessionManager.createSession();

  if (!session) {
    return new Response(`Session "${sessionId}" not found`, { status: 404 });
  }

  const { resolve: copilotResolver, promise: copilotPromise } =
    Promise.withResolvers<AgentResponse>();

  const agentLoop = new AgentLoop(
    {
      abortSignal: req.signal,
      copilotHandler: async (copilotReq) => {
        if (copilotResponse) {
          return copilotResponse;
        }

        copilotResolver({
          type: "copilot",
          result: copilotReq,
        });

        throw new Error("abort");
      },
    },
    session.messages
  );

  if (userInput) {
    const userMessages: UserModelMessage[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userInput,
          },
        ],
      },
    ];
    sessionManager.addMessages(session.id, userMessages);
    await agentLoop.userInput(userMessages);
  }

  const res = await Promise.race([
    copilotPromise,
    agentLoop.next().then<AgentResponse>((result) => ({
      type: "normal",
      result,
    })),
  ]);

  if (res.type === "normal") {
    sessionManager.addMessages(session.id, res.result.messages);
  }

  return new Response(
    JSON.stringify({
      sessionId: session.id,
      agentResponse: res,
    }),
    { status: 200 }
  );
}

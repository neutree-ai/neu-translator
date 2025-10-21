import { AgentLoop, type CopilotResponse, type UserModelMessage } from "core";
import { SessionManager } from "@/app/lib/storage";

const sessionManager = new SessionManager();

export type AgentResponse = Awaited<ReturnType<AgentLoop["next"]>>;

export async function POST(req: Request) {
  const {
    copilotResponses,
    sessionId,
    userInput,
  }: {
    sessionId?: string;
    userInput?: string;
    copilotResponses?: CopilotResponse[];
  } = await req.json();

  const session = sessionId
    ? sessionManager.getSession(sessionId)
    : sessionManager.createSession();

  if (!session) {
    return new Response(`Session "${sessionId}" not found`, { status: 404 });
  }

  const agentLoop = new AgentLoop(
    {
      abortSignal: req.signal,
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

  if (copilotResponses) {
    sessionManager.addCopilotResponses(session.id, copilotResponses);
    await agentLoop.addCopilotResponses(copilotResponses);
  }

  const res = await agentLoop.next();

  sessionManager.addMessages(session.id, res.messages);

  return new Response(
    JSON.stringify({
      sessionId: session.id,
      agentResponse: res,
    }),
    { status: 200 }
  );
}

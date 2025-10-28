import { SessionManager } from "@/app/lib/storage";

const sessionManager = new SessionManager();

export async function GET() {
  const sessions = sessionManager.listSessions();

  return new Response(
    JSON.stringify({
      sessions: sessions.map((session) => ({
        id: session.id,
        messageCount: session.messages.length,
        copilotResponseCount: session.copilotResponses.length,
      })),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

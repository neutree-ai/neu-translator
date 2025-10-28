import { SessionManager } from "@/app/lib/storage";

const sessionManager = new SessionManager();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const session = sessionManager.getSession(id);

  if (!session) {
    return new Response(
      JSON.stringify({
        error: `Session "${id}" not found`,
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return new Response(
    JSON.stringify({
      session: {
        id: session.id,
        messages: session.messages,
        copilotResponses: session.copilotResponses,
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

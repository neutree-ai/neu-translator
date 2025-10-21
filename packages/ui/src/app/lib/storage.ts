import type { Context } from "core";

type Session = {
  id: string;
  messages: Context["messages"];
  copilotResponses: Context["copilotResponses"];
};

const uuid = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export class SessionManager {
  sessions: Session[] = [];

  createSession() {
    const session = {
      id: uuid(),
      messages: [],
      copilotResponses: [],
    };

    this.sessions.push(session);

    return session;
  }

  getSession(id: string) {
    return this.sessions.find((s) => s.id === id);
  }

  addMessages(id: string, messages: Context["messages"]) {
    const session = this.getSession(id);
    if (session) {
      session.messages.push(...messages);
    }
  }

  addCopilotResponses(id: string, responses: Context["copilotResponses"]) {
    const session = this.getSession(id);
    if (session) {
      session.copilotResponses.push(...responses);
    }
  }
}

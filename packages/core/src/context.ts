import { type ModelMessage } from "ai";

export class Context<T extends ModelMessage = ModelMessage> {
  private messages: T[] = [];

  addMessages(messages: T[]) {
    this.messages.push(...messages);
  }

  getMessages(): T[] {
    return this.messages;
  }

  toModelMessages(): ModelMessage[] {
    return this.messages;
  }
}

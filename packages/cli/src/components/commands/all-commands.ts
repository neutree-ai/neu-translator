export enum CommandType {
  Translation = "translation",
  Memory = "memory",
}

export const commands = {
  [CommandType.Translation]: {
    short: "t",
    description: "Show the current translation",
  },
  [CommandType.Memory]: {
    short: "m",
    description: "Show the current memory",
  },
};

export enum CommandType {
  Translation = "translation",
  Memory = "memory",
  Compact = "compact",
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
  [CommandType.Compact]: {
    short: "c",
    description: "Trigger a context compaction",
  },
};

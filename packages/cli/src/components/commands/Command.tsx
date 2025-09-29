import React from "react";
import { Box, Text, useInput } from "ink";
import { TranslationCommand } from "./TranslationCommand.js";
import { commands, CommandType } from "./all-commands.js";
import { MemoryCommand } from "./MemoryCommand.js";
import { CompactCommand } from "./CompactCommand.js";

type CommandProps = {
  cmd: {
    indicator: boolean;
    value: string;
  };
  exitCmd: () => void;
};

export const Command: React.FC<CommandProps> = ({ cmd, exitCmd }) => {
  useInput((_, key) => {
    if (key.escape) {
      exitCmd();
    }
  });

  return (
    <Box flexDirection="column">
      <Text dimColor italic>
        Press esc to exit
      </Text>
      {(() => {
        switch (cmd.value) {
          case CommandType.Translation:
          case commands[CommandType.Translation].short:
            return <TranslationCommand />;
          case CommandType.Memory:
          case commands[CommandType.Memory].short:
            return <MemoryCommand />;
          case CommandType.Compact:
          case commands[CommandType.Compact].short:
            return <CompactCommand />;
          default:
            return (
              <Box>
                <Text>Unknown command: {cmd.value}</Text>
              </Box>
            );
        }
      })()}
    </Box>
  );
};

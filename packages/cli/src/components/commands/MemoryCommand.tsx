import React from "react";
import { Box, Text } from "ink";
import { useAgent } from "../../hooks/use-agent.js";

export const MemoryCommand: React.FC = () => {
  const { memoryRef } = useAgent();

  const memory = memoryRef.current?.provideMemory();

  return (
    <Box borderStyle="classic">
      <Text>{memory || "No memory yet"}</Text>
    </Box>
  );
};

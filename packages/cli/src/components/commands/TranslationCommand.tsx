import React from "react";
import { Box, Text } from "ink";
import { useTranslationState } from "../../hooks/use-translation-state.js";
import { useAgent } from "../../hooks/use-agent.js";

export const TranslationCommand: React.FC = () => {
  const { messages } = useAgent();
  const { currentTranslation } = useTranslationState(messages);

  return (
    <Box borderStyle="classic">
      <Text>{currentTranslation.translated}</Text>
    </Box>
  );
};

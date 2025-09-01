import React from "react";
import { Box, Text } from "ink";

export const Hello = () => {
  return (
    <Box flexDirection="column" padding={2}>
      <Box marginBottom={2}>
        <Text bold color="cyan">
          Welcome to NEU Translator!
        </Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text>
          A powerful translation tool that helps you translate text with AI assistance.
        </Text>
      </Box>
      
      <Box marginBottom={2}>
        <Text dimColor>
          Here are some example prompts to get you started:
        </Text>
      </Box>
      
      <Box flexDirection="column" marginLeft={2}>
        <Box marginBottom={1}>
          <Text color="green">• </Text>
          <Text>"Translate this text to Chinese: Hello, how are you today?"</Text>
        </Box>
        
        <Box marginBottom={1}>
          <Text color="green">• </Text>
          <Text>"Help me translate this document from English to Spanish"</Text>
        </Box>
        
        <Box marginBottom={1}>
          <Text color="green">• </Text>
          <Text>"What's the best way to translate technical terms?"</Text>
        </Box>
        
        <Box marginBottom={2}>
          <Text color="green">• </Text>
          <Text>"Translate and preserve the formatting of this markdown file"</Text>
        </Box>
      </Box>
      
      <Box>
        <Text dimColor italic>
          Type your message below to start translating! ✨
        </Text>
      </Box>
    </Box>
  );
};
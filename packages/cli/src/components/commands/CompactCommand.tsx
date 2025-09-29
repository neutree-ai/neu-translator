import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { useAgent } from "../../hooks/use-agent.js";
import { Spinner } from "@inkjs/ui";

export const CompactCommand: React.FC = () => {
  const { compact } = useAgent();

  const [state, setState] = useState({
    loading: false,
    result: {
      analysis: "",
      summary: "",
    },
  });

  useEffect(() => {
    setState((prev) => ({ ...prev, loading: true }));
    compact?.()
      .then((result) => {
        if (result) {
          setState((prev) => ({ ...prev, result }));
        }
      })
      .finally(() => {
        setState((prev) => ({ ...prev, loading: false }));
      });
  }, [compact]);

  if (state.loading) {
    return <Spinner label="Compacting..." />;
  }

  return (
    <Box borderStyle="classic" flexDirection="column" gap={1}>
      <Text italic dimColor>
        {state.result.analysis}
      </Text>
      <Text>{state.result.summary}</Text>
    </Box>
  );
};

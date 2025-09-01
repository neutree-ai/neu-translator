import { useCallback, useState } from "react";

export const useUserInput = ({
  submitAgent,
}: {
  submitAgent: (input: string) => unknown;
}) => {
  const [cmd, setCmd] = useState("");

  const handleUserInput = useCallback((input: string) => {
    if (!input.trim()) {
      return;
    }

    if (input.startsWith("/")) {
      const cmd = input.slice(1).trim();

      if (cmd) {
        setCmd(cmd);
        return;
      }
    }

    submitAgent(input);
  }, []);

  return {
    cmd,
    handleUserInput,
  };
};

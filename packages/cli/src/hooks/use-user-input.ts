import { useCallback, useState } from "react";

export const useUserInput = ({
  submitAgent,
}: {
  submitAgent: (input: string) => unknown;
}) => {
  const [cmd, setCmd] = useState({
    indicator: false,
    value: "",
  });

  const handleUserInput = useCallback((input: string) => {
    if (!input.trim()) {
      return;
    }

    if (input.startsWith("/")) {
      const value = input.slice(1).trim();

      if (value) {
        setCmd({
          indicator: true,
          value,
        });
        return;
      }
    }

    submitAgent(input);
  }, []);

  return {
    cmd,
    exitCmd: () =>
      setCmd({
        indicator: false,
        value: "",
      }),
    handleUserInput,
  };
};

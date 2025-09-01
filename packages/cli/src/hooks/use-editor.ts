import { useStdin } from "ink";
import { useCallback, useState } from "react";

export const useEditor = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { setRawMode, stdin } = useStdin();

  const withEditor = useCallback(
    async <T>(fn: () => T) => {
      setIsEditing(true);

      stdin.pause();
      setRawMode?.(false);
      console.clear();
      try {
        const res = fn();
        return res;
      } finally {
        console.clear();
        setRawMode?.(true);
        setIsEditing(false);
        stdin.resume();
      }
    },
    [setRawMode]
  );

  return {
    isEditing,
    withEditor,
  };
};

import { useCallback, useState } from 'react';

interface UseClipboardOptions {
  timeout?: number;
}

interface UseClipboardReturn {
  value: string;
  onCopy: () => void;
  hasCopied: boolean;
}

interface UseDynamicClipboardReturn {
  onCopy: (text: string) => void;
  hasCopied: boolean;
}

export const useDynamicClipboard = (
  options: UseClipboardOptions = {},
): UseDynamicClipboardReturn => {
  const [hasCopied, setHasCopied] = useState(false);
  const { timeout = 1500 } = options;

  const onCopy = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
        setHasCopied(true);
        setTimeout(() => {
          setHasCopied(false);
        }, timeout);
      });
    },
    [timeout],
  );

  return { onCopy, hasCopied };
};

export const useClipboard = (
  text: string,
  options: UseClipboardOptions = {},
): UseClipboardReturn => {
  const [hasCopied, setHasCopied] = useState(false);
  const { timeout = 1500 } = options;

  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setHasCopied(true);
      setTimeout(() => {
        setHasCopied(false);
      }, timeout);
    });
  }, [text, timeout]);

  return { value: text, onCopy, hasCopied };
};

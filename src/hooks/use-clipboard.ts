import { useCallback, useState } from 'react';

interface UseClipboardOptions {
  timeout?: number;
}

interface UseClipboardReturn {
  value: string;
  onCopy: () => void;
  hasCopied: boolean;
}

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

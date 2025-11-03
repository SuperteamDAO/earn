import { useCallback, useRef } from 'react';

export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const lastRan = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const handler = () => {
        const now = Date.now();
        // Initialize lastRan on first call (lazy initialization) and execute immediately
        if (lastRan.current === 0) {
          callback(...args);
          lastRan.current = now;
          return;
        }

        if (now - lastRan.current >= delay) {
          callback(...args);
          lastRan.current = now;
        } else {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(
            () => {
              callback(...args);
              lastRan.current = Date.now();
            },
            delay - (now - lastRan.current),
          );
        }
      };

      handler();
    },
    [callback, delay],
  );
}

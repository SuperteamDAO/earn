import { type RefObject, useEffect } from 'react';

export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: () => void,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return undefined;

    const handleClick = (event: MouseEvent) => {
      if (
        ref.current &&
        event.target instanceof Node &&
        !ref.current.contains(event.target)
      ) {
        handler();
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [ref, handler, enabled]);
}

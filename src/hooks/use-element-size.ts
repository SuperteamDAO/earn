import { useCallback, useRef, useState, useSyncExternalStore } from 'react';

interface ElementSize {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
  x: number;
  y: number;
}

const EMPTY_SIZE: ElementSize = Object.freeze({
  x: 0,
  y: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0,
});

function readElementSize(element: Element): ElementSize {
  const { x, y, top, right, bottom, left, width, height } =
    element.getBoundingClientRect();

  return { x, y, top, right, bottom, left, width, height };
}

export function useElementSize<T extends Element = HTMLDivElement>() {
  const [element, setElement] = useState<T | null>(null);
  const snapshotRef = useRef<ElementSize>(EMPTY_SIZE);

  const getSnapshot = useCallback(() => snapshotRef.current, []);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!element || typeof ResizeObserver === 'undefined') {
        snapshotRef.current = EMPTY_SIZE;
        return () => undefined;
      }

      const updateSize = () => {
        const nextSize = readElementSize(element);
        const previousSize = snapshotRef.current;

        if (
          previousSize.width === nextSize.width &&
          previousSize.height === nextSize.height
        ) {
          return;
        }

        snapshotRef.current = nextSize;
        onStoreChange();
      };

      updateSize();

      const observer = new ResizeObserver(updateSize);
      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    },
    [element],
  );

  const size = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const ref = useCallback((node: T | null) => {
    snapshotRef.current = node ? readElementSize(node) : EMPTY_SIZE;
    setElement(node);
  }, []);

  return [ref, size] as const;
}

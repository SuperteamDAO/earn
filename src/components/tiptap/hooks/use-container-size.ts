import { type RefObject, useCallback, useLayoutEffect, useState } from 'react';

const DEFAULT_RECT: DOMRect = {
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  toJSON: () => '{}',
};

export function useContainerSize(
  elementOrRef: HTMLElement | null | RefObject<HTMLElement | null>,
): DOMRect {
  const [size, setSize] = useState<DOMRect>(DEFAULT_RECT);

  const handleResize = useCallback(() => {
    const currentElement =
      elementOrRef && 'current' in elementOrRef
        ? elementOrRef.current
        : elementOrRef;
    if (!currentElement) return;

    const newRect = currentElement.getBoundingClientRect();

    setSize((prevRect) => {
      if (
        Math.round(prevRect.width) === Math.round(newRect.width) &&
        Math.round(prevRect.height) === Math.round(newRect.height) &&
        Math.round(prevRect.x) === Math.round(newRect.x) &&
        Math.round(prevRect.y) === Math.round(newRect.y)
      ) {
        return prevRect;
      }
      return newRect;
    });
  }, [elementOrRef]);

  useLayoutEffect(() => {
    const currentElement =
      elementOrRef && 'current' in elementOrRef
        ? elementOrRef.current
        : elementOrRef;

    if (!currentElement) {
      setTimeout(() => {
        setSize((prev) => {
          if (
            prev.width !== DEFAULT_RECT.width ||
            prev.height !== DEFAULT_RECT.height
          ) {
            return DEFAULT_RECT;
          }
          return prev;
        });
      }, 0);
      return;
    }

    const initialRect = currentElement.getBoundingClientRect();
    setTimeout(() => {
      setSize((prev) => {
        if (
          Math.round(prev.width) !== Math.round(initialRect.width) ||
          Math.round(prev.height) !== Math.round(initialRect.height) ||
          Math.round(prev.x) !== Math.round(initialRect.x) ||
          Math.round(prev.y) !== Math.round(initialRect.y)
        ) {
          return initialRect;
        }
        return prev;
      });
    }, 0);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(currentElement);

    window.addEventListener('click', handleResize);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('click', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, [elementOrRef, handleResize]);

  return size;
}

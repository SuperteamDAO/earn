'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useScrollShadow<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const handleScroll = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const { scrollLeft, scrollWidth, clientWidth } = element;

    const tolerance = 1;

    setShowLeftShadow(scrollLeft > tolerance);
    setShowRightShadow(scrollWidth - scrollLeft - clientWidth > tolerance);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    handleScroll();

    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(element);
    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      resizeObserver.unobserve(element);
      resizeObserver.disconnect();
    };
  }, [handleScroll]);

  return { ref, showLeftShadow, showRightShadow };
}

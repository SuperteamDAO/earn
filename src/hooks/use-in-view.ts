import { useCallback, useEffect, useRef, useState } from 'react';

interface UseInViewOptions extends IntersectionObserverInit {
  initialInView?: boolean;
}

export function useInView(options: UseInViewOptions = {}) {
  const { initialInView = false, root = null, rootMargin, threshold } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [inView, setInView] = useState(initialInView);

  const ref = useCallback(
    (node: Element | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;

      if (!node || typeof IntersectionObserver === 'undefined') {
        setInView(initialInView);
        return;
      }

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          setInView(entry?.isIntersecting ?? false);
        },
        {
          root,
          rootMargin,
          threshold,
        },
      );

      observerRef.current.observe(node);
    },
    [initialInView, root, rootMargin, threshold],
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { ref, inView };
}

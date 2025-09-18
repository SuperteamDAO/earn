import { useEffect, useState } from 'react';

import { cn } from '@/utils/cn';

interface Props {
  scrollEl: HTMLDivElement | null;
  FADE_DISTANCE?: number;
}
export function ProgressiveOpacityOut({ scrollEl, FADE_DISTANCE = 64 }: Props) {
  const [fadeOpacity, setFadeOpacity] = useState(1);

  const updateFade = () => {
    if (!scrollEl) return;
    const isScrollable = scrollEl.scrollHeight > scrollEl.clientHeight;
    if (!isScrollable) {
      setFadeOpacity(0);
      return;
    }
    const distanceFromBottom =
      scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
    const clamped = Math.max(0, Math.min(distanceFromBottom, FADE_DISTANCE));
    const opacity = clamped / FADE_DISTANCE;
    setFadeOpacity(opacity);
  };

  useEffect(() => {
    if (!scrollEl) return;
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        updateFade();
        rafId = null;
      });
    };

    scrollEl.addEventListener('scroll', handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => updateFade());
    resizeObserver.observe(scrollEl);

    updateFade();

    return () => {
      scrollEl.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [scrollEl]);

  return (
    <div
      className={cn(
        'pointer-events-none absolute bottom-16 left-0 h-24 w-full bg-gradient-to-t from-white to-transparent',
      )}
      style={{ opacity: fadeOpacity, transition: 'opacity 0.2s' }}
    />
  );
}

import { useEffect, useState } from 'react';

interface Props {
  scrollEl: HTMLDivElement | null;
  FADE_DISTANCE?: number;
}
export function ProgressiveBlurOut({ scrollEl, FADE_DISTANCE = 64 }: Props) {
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
    const handleScroll = () => updateFade();
    scrollEl.addEventListener('scroll', handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => updateFade());
    resizeObserver.observe(scrollEl);

    updateFade();

    return () => {
      scrollEl.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [scrollEl]);

  return (
    <div
      className="pointer-events-none absolute bottom-16 left-0 h-24 w-full"
      style={{
        opacity: fadeOpacity > 0 ? 1 : 0,
        transition: 'opacity 0.2s',
      }}
    >
      <div
        className="absolute top-0 left-0 h-full w-full [mask-image:linear-gradient(rgba(0,0,0,0)_20%,rgba(0,0,0,1)_60%,rgba(0,0,0,0)_80%)]"
        style={{
          backdropFilter: `blur(${fadeOpacity * 1}px)`,
          WebkitBackdropFilter: `blur(${fadeOpacity * 1}px)`,
          transition: 'backdrop-filter 0.2s, -webkit-backdrop-filter 0.2s',
        }}
      />
      <div
        className="absolute top-0 left-0 h-full w-full [mask-image:linear-gradient(rgba(0,0,0,0)_40%,rgba(0,0,0,1)_80%,rgba(0,0,0,0)_100%)]"
        style={{
          backdropFilter: `blur(${fadeOpacity * 2}px)`,
          WebkitBackdropFilter: `blur(${fadeOpacity * 2}px)`,
          transition: 'backdrop-filter 0.2s, -webkit-backdrop-filter 0.2s',
        }}
      />
      <div
        className="absolute top-0 left-0 h-full w-full [mask-image:linear-gradient(rgba(0,0,0,0)_60%,rgba(0,0,0,1)_90%,rgba(0,0,0,0)_100%)]"
        style={{
          backdropFilter: `blur(${fadeOpacity * 3}px)`,
          WebkitBackdropFilter: `blur(${fadeOpacity * 3}px)`,
          transition: 'backdrop-filter 0.2s, -webkit-backdrop-filter 0.2s',
        }}
      />
      <div className="absolute inset-0 top-0 left-0 h-full w-full bg-gradient-to-b from-transparent to-white/70" />
    </div>
  );
}

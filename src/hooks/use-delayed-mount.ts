import { useEffect, useState } from 'react';

/**
 * A hook that returns true after a specified delay, once the page has fully loaded.
 * This is useful for deferring the rendering of non-critical components
 * to improve initial page load performance.
 * It uses `requestIdleCallback` to ensure the mount happens during browser idle time.
 *
 * @param options - The options for the hook.
 * @param options.delay - The delay in milliseconds after the page load event. Defaults to 5000ms.
 */
export const useDelayedMount = ({ delay = 5000 } = {}): boolean => {
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    const mountComponent = () => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          setShouldMount(true);
        });
      } else {
        setShouldMount(true);
      }
    };

    const startTimer = () => {
      timerId = setTimeout(mountComponent, delay);
    };

    if (document.readyState === 'complete') {
      startTimer();
    } else {
      window.addEventListener('load', startTimer, { once: true });
    }

    return () => {
      clearTimeout(timerId);
      window.removeEventListener('load', startTimer);
    };
  }, [delay]);

  return shouldMount;
};

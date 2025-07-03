import { useCallback, useSyncExternalStore } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpointValues: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

function subscribe(callback: () => void) {
  window.addEventListener('resize', callback);
  return () => {
    window.removeEventListener('resize', callback);
  };
}

export const useBreakpoint = (breakpoint: Breakpoint): boolean => {
  const getSnapshot = useCallback(() => {
    return window.innerWidth >= breakpointValues[breakpoint];
  }, [breakpoint]);

  const getServerSnapshot = () => {
    return false;
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

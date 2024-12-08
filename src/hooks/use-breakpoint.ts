import { useEffect, useState } from 'react';
import resolveConfig from 'tailwindcss/resolveConfig';

import tailwindConfig from '../../tailwind.config';

const fullConfig = resolveConfig(tailwindConfig);

type Breakpoint = keyof typeof fullConfig.theme.screens;

const getBreakpointValue = (breakpoint: Breakpoint): number => {
  const value = fullConfig.theme.screens[breakpoint];
  return parseInt(value.slice(0, value.indexOf('px')));
};

export const useBreakpoint = (breakpoint: Breakpoint): boolean => {
  const [isBreakpoint, setIsBreakpoint] = useState<boolean>(false);

  useEffect(() => {
    const checkBreakpoint = () => {
      const breakpointValue = getBreakpointValue(breakpoint);
      setIsBreakpoint(window.innerWidth >= breakpointValue);
    };

    checkBreakpoint();

    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [breakpoint]);

  return isBreakpoint;
};

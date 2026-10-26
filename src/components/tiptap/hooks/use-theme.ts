import * as React from 'react';

const DARK = '(prefers-color-scheme: dark)';

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(DARK);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const isDark = () => window.matchMedia(DARK).matches;

export const useTheme = () =>
  React.useSyncExternalStore(subscribe, isDark, () => false);

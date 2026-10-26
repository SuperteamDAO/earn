'use client';

import { createContext, useContext } from 'react';

import type { ChapterRegionData } from '@/interface/chapter';

// What the shell (header, footer) shows beyond the viewer, loaded on the
// server by src/app/earn/layout.tsx. Pages still on the Pages Router have
// no provider and get the defaults.
export interface ShellData {
  // A lapsed session renewing in place: the corner shows that, not Login.
  readonly resuming: boolean;
  // Submissions left this month.
  readonly creditBalance: number;
  // Earn's active chapters, for the footer's region picker.
  readonly chapters: ChapterRegionData[];
}

const EMPTY: ShellData = { resuming: false, creditBalance: 0, chapters: [] };

const ShellDataContext = createContext<ShellData>(EMPTY);

export function ShellDataProvider({
  value,
  children,
}: {
  value: ShellData;
  children: React.ReactNode;
}) {
  return <ShellDataContext value={value}>{children}</ShellDataContext>;
}

export const useShellData = (): ShellData => useContext(ShellDataContext);

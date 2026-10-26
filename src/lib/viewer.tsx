'use client';

import { createContext, useContext } from 'react';

// A type-only import: nothing of the server module reaches the bundle.
import type { Viewer } from '@/server/users';

const ViewerContext = createContext<Viewer | null>(null);

// The signed-in person's Earn account, loaded by the root layout on the
// server (src/lib/session.ts `getViewer`) and handed down. Client components
// read it here instead of fetching it. After a write that changes it, call
// `router.refresh()` and the layout loads it again.
export function ViewerProvider({
  viewer,
  children,
}: {
  viewer: Viewer | null;
  children: React.ReactNode;
}) {
  return <ViewerContext value={viewer}>{children}</ViewerContext>;
}

// null when signed out or without an Earn account yet.
export const useViewer = (): Viewer | null => useContext(ViewerContext);

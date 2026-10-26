'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// False on the server and while hydrating, true after. Feed cards nest
// links in links, which only the browser's DOM (not its HTML parser) keeps
// as Earn lays them out, so they render on the client, as Earn's did.
export const useMounted = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

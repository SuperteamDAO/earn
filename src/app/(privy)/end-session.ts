'use client';

import { usePrivy } from '@privy-io/react-auth';

// Ends the session on the server and in Privy; true only if no token
// survived. Shared by the wallet page's sign-out and sign-in's sign-out
// frame.
export function useEndSession() {
  const { ready, logout, getAccessToken } = usePrivy();

  async function endSession(): Promise<boolean> {
    // Server first, so the session ends even if Privy's logout quietly fails.
    const server = await fetch('/earn/sign-out/', { method: 'POST' }).catch(
      () => null,
    );
    await logout().catch(() => undefined);
    // Privy's logout resolves either way, so check no token survived it.
    const leftover = await getAccessToken().catch(() => null);
    return Boolean(server?.ok) && !leftover;
  }

  return { ready, endSession };
}

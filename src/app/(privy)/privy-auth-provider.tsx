'use client';

import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { useEffect, useState } from 'react';

import { publicEnv } from '@/lib/public-env';

// What the provider needs from the server (see privy-props.ts).
export interface PrivyProps {
  readonly appId: string;
  readonly clientId: string | undefined;
  // This response's script nonce, so Privy's own scripts may run.
  readonly nonce: string | undefined;
}

// Calls `onReady` once Privy has started: its refresh is done.
function Ready({ onReady }: { onReady: () => void }) {
  const { ready } = usePrivy();
  useEffect(() => {
    if (ready) onReady();
  }, [ready, onReady]);
  return null;
}

// The RPC Privy's embedded wallet signs against, as Earn configured it.
function solanaConfig() {
  const { rpcUrl, rpcWsUrl } = publicEnv;
  if (!rpcUrl || !rpcWsUrl) return undefined;
  return {
    rpcs: {
      'solana:mainnet': {
        rpc: createSolanaRpc(`https://${rpcUrl}`),
        rpcSubscriptions: createSolanaRpcSubscriptions(rpcWsUrl),
      },
    },
  } as const;
}

// Mounted only where Privy is used, so each page decides when it starts
// (see turn.ts).
export function PrivyAuthProvider({
  appId,
  clientId,
  nonce,
  onReady,
  children,
}: PrivyProps & {
  onReady?: () => void;
  children: React.ReactNode;
}) {
  const [solana] = useState(solanaConfig);
  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId}
      config={{
        loginMethods: ['email', 'google'],
        // Earn makes each account's Solana wallet on the server when the
        // profile is finished; never on sign-in.
        embeddedWallets: {
          ethereum: { createOnLogin: 'off' },
          solana: { createOnLogin: 'off' },
          showWalletUIs: true,
        },
        externalWallets: {
          disableAllExternalWallets: true,
          walletConnect: { enabled: false },
        },
        appearance: { walletList: [] },
        ...(solana ? { solana } : {}),
        scriptNonce: nonce,
      }}
    >
      {onReady && <Ready onReady={onReady} />}
      {children}
    </PrivyProvider>
  );
}

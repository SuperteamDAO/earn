import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  const [queryClient] = useState(() => new QueryClient());

  const wsUrl = process.env.NEXT_PUBLIC_RPC_WS_URL;

  return (
    <SessionProvider session={session}>
      <PrivyProvider
        config={{
          loginMethods: ['email', 'google'],
          solana: {
            rpcs: {
              'solana:mainnet': {
                rpc: createSolanaRpc(
                  `https://${process.env.NEXT_PUBLIC_RPC_URL}`,
                ),
                ...(wsUrl
                  ? {
                      rpcSubscriptions: createSolanaRpcSubscriptions(wsUrl),
                    }
                  : {}),
              },
            },
          },
        }}
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      >
        <QueryClientProvider client={queryClient}>
          <PrivyInitFlagBridge />
          {children}
        </QueryClientProvider>
      </PrivyProvider>
    </SessionProvider>
  );
}

function PrivyInitFlagBridge(): null {
  const { ready } = usePrivy();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__privyInitializing = !ready;
    }
  }, [ready]);
  return null;
}

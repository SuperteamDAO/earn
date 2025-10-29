'use client';
import { PrivyProvider } from '@privy-io/react-auth';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

import { fontMono, fontSans } from '@/theme/fonts';

const queryClient = new QueryClient();

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
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
                rpcSubscriptions: createSolanaRpcSubscriptions(
                  `${process.env.NEXT_PUBLIC_RPC_WS_URL}`,
                ),
              },
            },
          },
        }}
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      >
        <QueryClientProvider client={queryClient}>
          <style jsx global>{`
            :root {
              --font-sans: ${fontSans.style.fontFamily};
              --font-mono: ${fontMono.style.fontFamily};
            }
          `}</style>
          {children}
        </QueryClientProvider>
      </PrivyProvider>
    </SessionProvider>
  );
}

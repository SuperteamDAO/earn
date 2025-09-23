import { PrivyProvider } from '@privy-io/react-auth';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { useState } from 'react';

import { fontMono, fontSans } from '@/theme/fonts';

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider session={session}>
      <PrivyProvider
        config={{
          externalWallets: {
            walletConnect: { enabled: false },
            disableAllExternalWallets: true,
          },
          appearance: { walletChainType: 'solana-only' },
          loginMethods: ['email', 'google'],
          solana: {
            rpcs: {
              'solana:mainnet': {
                rpc: createSolanaRpc(
                  `https://${process.env.NEXT_PUBLIC_RPC_URL}`,
                ),
                rpcSubscriptions: createSolanaRpcSubscriptions(
                  'wss://api.mainnet-beta.solana.com',
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

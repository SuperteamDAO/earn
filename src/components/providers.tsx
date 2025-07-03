import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { fontMono, fontSans } from '@/theme/fonts';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      config={{
        externalWallets: {
          walletConnect: { enabled: false },
          disableAllExternalWallets: true,
        },
        appearance: { walletChainType: 'solana-only' },
        loginMethods: ['email', 'google'],
        solanaClusters: [
          {
            name: 'mainnet-beta',
            rpcUrl: `https://${process.env.NEXT_PUBLIC_RPC_URL}`,
          },
        ],
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
  );
}

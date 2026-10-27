import '@solana/wallet-adapter-react-ui/styles.css';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { useMemo } from 'react';

export function SolanaWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const endpoint = `https://${process.env.NEXT_PUBLIC_RPC_URL}`;

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{ commitment: 'confirmed' }}
    >
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

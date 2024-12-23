import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { useMemo } from 'react';

import '@solana/wallet-adapter-react-ui/styles.css';

export function SolanaWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const network = WalletAdapterNetwork.Mainnet;

  const rpc = `https://${process.env.NEXT_PUBLIC_RPC_URL}`;

  const endpoint = useMemo(() => rpc, [network]);

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{ commitment: 'confirmed' }}
    >
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

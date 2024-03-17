import '@solana/wallet-adapter-react-ui/styles.css';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { useMemo } from 'react';

export function SolanaWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const network = WalletAdapterNetwork.Mainnet;

  let rpc: string;
  if (process.env.NODE_ENV === 'production') {
    rpc = 'https://earn.superteam.fun/api/rpcProxy';
  } else {
    rpc = 'https://beta.earn.superteam.fun/api/rpcProxy';
  }

  const endpoint = useMemo(() => rpc, [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { type TokenAsset } from '../../types/TokenAsset';
import { createTransferInstructions } from '../../utils/createTransferInstructions';
import {
  type WithdrawFormData,
  withdrawFormSchema,
} from '../../utils/withdrawFormSchema';
import { type DrawerView } from '../WalletDrawer';
import { TransactionDetails } from './TransactionDetails';
import { WithdrawForm } from './WithdrawForm';

interface WithdrawFlowProps {
  tokens: TokenAsset[];
  view: DrawerView;
  setView: (view: DrawerView) => void;
}

export function WithdrawFundsFlow({
  tokens,
  view,
  setView,
}: WithdrawFlowProps) {
  const { user } = useUser();
  const [txData, setTxData] = useState<{
    signature: string;
    values: WithdrawFormData;
  }>({ signature: '', values: {} as WithdrawFormData });

  const form = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawFormSchema),
    defaultValues: {
      tokenAddress: tokens[0]?.tokenAddress ?? '',
      amount: '',
      address: '',
    },
  });

  const selectedToken = tokens.find(
    (token) => token.tokenAddress === form.watch('tokenAddress'),
  );

  const { wallets } = useSolanaWallets();
  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === 'privy',
  );

  async function handleWithdraw(values: WithdrawFormData) {
    try {
      const connection = new Connection(
        `https://${process.env.NEXT_PUBLIC_RPC_URL}`,
      );

      const { blockhash } = await connection.getLatestBlockhash('finalized');

      const instructions = await createTransferInstructions(
        connection,
        values,
        user?.walletAddress as string,
        selectedToken,
      );

      const message = new TransactionMessage({
        payerKey: new PublicKey(process.env.NEXT_PUBLIC_FEEPAYER as string),
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(message);
      const serializedMessage = Buffer.from(
        transaction.message.serialize(),
      ).toString('base64');

      const provider = await embeddedWallet?.getProvider();
      const { signature: serializedUserSignature } = await provider?.request({
        method: 'signMessage',
        params: { message: serializedMessage },
      });

      const userSignature = Buffer.from(serializedUserSignature, 'base64');
      transaction.addSignature(
        new PublicKey(user?.walletAddress as string),
        userSignature,
      );

      const serializedTransaction = Buffer.from(
        transaction.serialize(),
      ).toString('base64');

      const response = await api.post('/api/wallet/sign-transaction', {
        serializedTransaction,
      });

      const signedTransaction = VersionedTransaction.deserialize(
        Buffer.from(response.data.serializedTransaction, 'base64'),
      );

      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
      );

      if (signature) {
        setTxData({ signature, values });
        setView('success');
      }

      return signature;
    } catch (error) {
      console.error('Withdrawal failed:', error);
      throw error;
    }
  }

  return (
    <div>
      {view === 'withdraw' && (
        <WithdrawForm
          form={form}
          selectedToken={selectedToken}
          onSubmit={handleWithdraw}
          tokens={tokens}
        />
      )}

      {view === 'success' && (
        <TransactionDetails
          recipient={txData.values.address}
          amount={txData.values.amount}
          token={selectedToken?.tokenSymbol ?? 'SOL'}
          txId={txData.signature}
          tokenImg={selectedToken?.tokenImg ?? ''}
        />
      )}
    </div>
  );
}

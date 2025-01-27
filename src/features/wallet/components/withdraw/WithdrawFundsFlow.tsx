import { zodResolver } from '@hookform/resolvers/zod';
import { useSendTransaction } from '@privy-io/react-auth/solana';
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

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
  const { sendTransaction } = useSendTransaction();
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

  async function handleWithdraw(values: WithdrawFormData) {
    try {
      const connection = new Connection(
        `https://${process.env.NEXT_PUBLIC_RPC_URL}`,
      );

      const { blockhash } = await connection.getLatestBlockhash('finalized');
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(user?.walletAddress as string);

      const instructions = await createTransferInstructions(
        connection,
        values,
        user?.walletAddress as string,
        selectedToken,
      );

      const compute = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000000 }),
      ];

      transaction.add(...instructions, ...compute);

      const { signature } = await sendTransaction({ transaction, connection });

      if (signature) {
        setTxData({ signature, values });
        setView('success');
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
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

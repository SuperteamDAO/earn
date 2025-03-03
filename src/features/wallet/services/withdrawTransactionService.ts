import {
  Connection,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import { api } from '@/lib/api';

import { type TokenAsset } from '../types/TokenAsset';
import { createTransferInstructions } from '../utils/createTransferInstructions';
import { pollForSignature } from '../utils/pollForSignature';
import { type WithdrawFormData } from '../utils/withdrawFormSchema';

interface ProcessTransactionParams {
  values: WithdrawFormData;
  userWalletAddress: string;
  selectedToken: TokenAsset | undefined;
  signTransaction: any;
  sendTransaction: any;
  userId?: string;
}

interface TransactionResult {
  signature: string;
}

export async function processWithdrawTransaction({
  values,
  userWalletAddress,
  selectedToken,
  signTransaction,
  sendTransaction,
}: ProcessTransactionParams): Promise<TransactionResult> {
  const connection = new Connection(
    `https://${process.env.NEXT_PUBLIC_RPC_URL}`,
  );

  let blockhash;
  try {
    const response = await connection.getLatestBlockhash('finalized');
    blockhash = response.blockhash;
  } catch (e) {
    throw new Error('RPC Timed out');
  }

  const { instructions, requiresATACreation } =
    await createTransferInstructions(
      connection,
      values,
      userWalletAddress,
      selectedToken,
    );

  let signature: string;

  if (requiresATACreation) {
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(userWalletAddress);

    transaction.add(...instructions);
    const result = await sendTransaction({ transaction, connection });

    signature = result.signature;
  } else {
    const message = new TransactionMessage({
      payerKey: new PublicKey(process.env.NEXT_PUBLIC_FEEPAYER as string),
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(message);

    const userSignedTransaction = await signTransaction({
      transaction,
      connection,
    });

    const serializedTransaction = Buffer.from(
      userSignedTransaction.serialize(),
    ).toString('base64');

    const response = await api.post('/api/wallet/sign-transaction', {
      serializedTransaction,
    });

    const signedTransaction = VersionedTransaction.deserialize(
      Buffer.from(response.data.serializedTransaction, 'base64'),
    );

    signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
    );

    const confirmation = await connection.confirmTransaction(
      signature,
      'confirmed',
    );

    if (confirmation.value.err) {
      throw new Error('Transaction failed');
    }
  }

  try {
    await pollForSignature(signature, connection);
  } catch (e) {
    console.error('Transaction polling failed:', e);
    throw new Error(
      'Transaction might have gone through, check before proceeding',
    );
  }

  return { signature };
}

export function handleWithdrawError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Transaction failed. Please try again.';
  }

  if (error.message === 'MFA canceled' || error.message === 'MFA cancelled') {
    return 'Please complete two-factor authentication to withdraw';
  }

  if (error.message.includes('insufficient lamports')) {
    return 'Transaction Failed: Sending to this wallet requires you to deposit a small amount of SOL (0.003 SOL) into your Earn wallet. Or, try sending your rewards to an existing wallet which has interacted with stablecoins before.';
  }

  return error.message;
}

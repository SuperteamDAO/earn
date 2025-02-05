import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  type Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  type TransactionInstruction,
} from '@solana/web3.js';

import { tokenList } from '@/constants/tokenList';

import { type TokenAsset } from '../types/TokenAsset';
import { type WithdrawFormData } from './withdrawFormSchema';

export async function createTransferInstructions(
  connection: Connection,
  values: WithdrawFormData,
  userAddress: string,
  selectedToken?: TokenAsset,
): Promise<TransactionInstruction[]> {
  const instructions: TransactionInstruction[] = [];

  if (values.tokenAddress === 'So11111111111111111111111111111111111111112') {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(userAddress),
        toPubkey: new PublicKey(values.address),
        lamports: LAMPORTS_PER_SOL * Number(values.amount),
      }),
    );
  } else {
    const senderATA = await getAssociatedTokenAddressSync(
      new PublicKey(values.tokenAddress),
      new PublicKey(userAddress),
    );

    const receiverATA = await getAssociatedTokenAddressSync(
      new PublicKey(values.tokenAddress),
      new PublicKey(values.address),
    );

    const receiverATAExists = await connection.getAccountInfo(receiverATA);
    const tokenDetails = tokenList.find(
      (e) => e.tokenSymbol === selectedToken?.tokenSymbol,
    );
    const power = tokenDetails?.decimals as number;

    if (!receiverATAExists) {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          new PublicKey(userAddress),
          receiverATA,
          new PublicKey(values.address),
          new PublicKey(values.tokenAddress),
        ),
      );
    }

    instructions.push(
      createTransferInstruction(
        senderATA,
        receiverATA,
        new PublicKey(userAddress),
        Number(values.amount) * 10 ** power,
      ),
    );

    instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000000 }),
    );
  }

  return instructions;
}

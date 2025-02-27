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

  const sender = new PublicKey(userAddress);
  const recipient = new PublicKey(values.address);
  const tokenMint = new PublicKey(values.tokenAddress);

  if (values.tokenAddress === 'So11111111111111111111111111111111111111112') {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: recipient,
        lamports: LAMPORTS_PER_SOL * Number(values.amount),
      }),
    );
  } else {
    const senderATA = await getAssociatedTokenAddressSync(tokenMint, sender);

    const receiverATA = await getAssociatedTokenAddressSync(
      tokenMint,
      recipient,
    );

    const receiverATAExists = await connection.getAccountInfo(receiverATA);
    const tokenDetails = tokenList.find(
      (e) => e.tokenSymbol === selectedToken?.tokenSymbol,
    );
    const power = tokenDetails?.decimals as number;

    if (!receiverATAExists) {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          sender,
          receiverATA,
          recipient,
          tokenMint,
        ),
      );
    }

    instructions.push(
      createTransferInstruction(
        senderATA,
        receiverATA,
        sender,
        Number(values.amount) * 10 ** power,
      ),
    );

    instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 40000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
    );
  }

  return instructions;
}

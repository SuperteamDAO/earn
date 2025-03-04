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
import { fetchTokenUSDValue } from './fetchTokenUSDValue';
import { type WithdrawFormData } from './withdrawFormSchema';

export async function createTransferInstructions(
  connection: Connection,
  values: WithdrawFormData,
  userAddress: string,
  selectedToken?: TokenAsset,
): Promise<{
  instructions: TransactionInstruction[];
  receiverATAExists: boolean;
}> {
  const instructions: TransactionInstruction[] = [];

  const sender = new PublicKey(userAddress);
  const recipient = new PublicKey(values.address);
  const tokenMint = new PublicKey(values.tokenAddress);
  const feePayer = new PublicKey(process.env.NEXT_PUBLIC_FEEPAYER as string);

  let ataCreationCost = 0;
  let receiverATAExists = false;

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
    receiverATAExists = !!(await connection.getAccountInfo(receiverATA));

    const tokenDetails = tokenList.find(
      (e) => e.tokenSymbol === selectedToken?.tokenSymbol,
    );
    const power = tokenDetails?.decimals as number;

    if (!receiverATAExists) {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          feePayer,
          receiverATA,
          recipient,
          tokenMint,
        ),
      );

      try {
        const tokenUSDValue = await fetchTokenUSDValue(
          selectedToken?.tokenAddress || '',
        );
        const solUSDValue = await fetchTokenUSDValue(
          'So11111111111111111111111111111111111111112',
        );

        const ataCreationCostInUSD = solUSDValue * 0.0021;
        const tokenAmountToCharge = ataCreationCostInUSD / tokenUSDValue;

        ataCreationCost = Math.ceil(tokenAmountToCharge * 10 ** power);

        const feePayerATA = await getAssociatedTokenAddressSync(
          tokenMint,
          feePayer,
        );
        const feePayerATAExists = await connection.getAccountInfo(feePayerATA);

        if (!feePayerATAExists) {
          instructions.push(
            createAssociatedTokenAccountInstruction(
              feePayer,
              feePayerATA,
              feePayer,
              tokenMint,
            ),
          );
        }

        instructions.push(
          createTransferInstruction(
            senderATA,
            feePayerATA,
            sender,
            ataCreationCost,
          ),
        );
      } catch (error) {
        console.error('Error calculating ATA creation fee:', error);
        throw new Error(
          'Failed to calculate token values for ATA creation fee. Transaction aborted.',
        );
      }
    }

    const withdrawAmount = Number(values.amount) * 10 ** power;

    instructions.push(
      createTransferInstruction(
        senderATA,
        receiverATA,
        sender,
        withdrawAmount - ataCreationCost,
      ),
    );

    instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 40000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
    );
  }

  return { instructions, receiverATAExists };
}

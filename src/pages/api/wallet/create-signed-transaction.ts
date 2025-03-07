import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { type NextApiResponse } from 'next';

import { tokenList } from '@/constants/tokenList';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { fetchTokenUSDValue } from '@/features/wallet/utils/fetchTokenUSDValue';
import { withdrawFormSchema } from '@/features/wallet/utils/withdrawFormSchema';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { userId, body } = req;

  try {
    const validatedBody = withdrawFormSchema.parse(body);
    const { recipientAddress, amount, tokenAddress } = validatedBody;

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { walletAddress: true },
    });

    if (!user.walletAddress) {
      throw new Error('User wallet address not found');
    }

    const connection = new Connection(
      `https://${process.env.NEXT_PUBLIC_RPC_URL}`,
    );

    const { blockhash } = await connection.getLatestBlockhash('finalized');
    const instructions = [];

    const sender = new PublicKey(user.walletAddress);
    const recipient = new PublicKey(recipientAddress);
    const tokenMint = new PublicKey(tokenAddress);
    const feePayerWallet = Keypair.fromSecretKey(
      bs58.decode(process.env.FEEPAYER_PRIVATE_KEY as string),
    );
    const feePayer = feePayerWallet.publicKey;

    if (!process.env.FEEPAYER_PRIVATE_KEY) {
      throw new Error('Fee payer private key not configured');
    }

    let ataCreationCost = 0;
    let receiverATAExists = true;

    if (tokenAddress === 'So11111111111111111111111111111111111111112') {
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: sender,
          toPubkey: recipient,
          lamports: LAMPORTS_PER_SOL * Number(amount),
        }),
      );
    } else {
      const senderATA = getAssociatedTokenAddressSync(tokenMint, sender);
      const receiverATA = getAssociatedTokenAddressSync(tokenMint, recipient);
      receiverATAExists = !!(await connection.getAccountInfo(receiverATA));

      const token = tokenList.find((e) => e.mintAddress === tokenAddress);

      if (!token) {
        throw new Error('Invalid token selected');
      }

      const power = token.decimals;

      if (!receiverATAExists) {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            feePayer,
            receiverATA,
            recipient,
            tokenMint,
          ),
        );

        const tokenUSDValue = await fetchTokenUSDValue(tokenAddress);
        const solUSDValue = await fetchTokenUSDValue(
          'So11111111111111111111111111111111111111112',
        );

        const ataCreationCostInUSD = solUSDValue * 0.0021;
        const tokenAmountToCharge = ataCreationCostInUSD / tokenUSDValue;
        ataCreationCost = Math.ceil(tokenAmountToCharge * 10 ** power);

        const feePayerATA = getAssociatedTokenAddressSync(tokenMint, feePayer);
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
      }

      const withdrawAmount = Number(amount) * 10 ** power;

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

    const message = new TransactionMessage({
      payerKey: feePayer,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(message);

    transaction.sign([feePayerWallet]);

    return res.status(200).json({
      serializedTransaction: Buffer.from(transaction.serialize()).toString(
        'base64',
      ),
      receiverATAExists,
      ataCreationCost,
    });
  } catch (error: any) {
    logger.error(
      `Failed to create transfer transaction for user ${userId}: ${safeStringify(
        error,
      )}`,
    );
    return res.status(400).json({ error: error.message });
  }
}

export default withAuth(handler);

import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  type Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SendTransactionError,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { tokenList } from '@/constants/tokenList';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import { fetchTokenUSDValue } from '@/features/wallet/utils/fetchTokenUSDValue';
import { getConnection } from '@/features/wallet/utils/getConnection';
import { withdrawFormSchema } from '@/features/wallet/utils/withdrawFormSchema';

const tokenProgramCache: Record<string, string> = {};

async function isToken2022Token(
  connection: Connection,
  mintAddress: string,
): Promise<boolean> {
  if (mintAddress === 'So11111111111111111111111111111111111111112') {
    return false;
  }
  if (tokenProgramCache[mintAddress]) {
    return tokenProgramCache[mintAddress] === TOKEN_2022_PROGRAM_ID.toString();
  }
  try {
    const mintInfo = await connection.getAccountInfo(
      new PublicKey(mintAddress),
    );
    if (!mintInfo) {
      logger.error(`Mint account not found: ${mintAddress}`);
      return false;
    }
    tokenProgramCache[mintAddress] = mintInfo.owner.toString();
    return mintInfo.owner.toString() === TOKEN_2022_PROGRAM_ID.toString();
  } catch (error) {
    logger.error(`Error checking token program: ${safeStringify(error)}`);
    return false;
  }
}

async function calculateAtaCreationCost(
  tokenAddress: string,
  decimals: number,
): Promise<number> {
  const tokenUSDValue = await fetchTokenUSDValue(tokenAddress);
  const solUSDValue = await fetchTokenUSDValue(
    'So11111111111111111111111111111111111111112',
  );
  const ataCreationCostInUSD = solUSDValue * 0.0021;
  const tokenAmountToCharge = ataCreationCostInUSD / tokenUSDValue;
  return Math.ceil(tokenAmountToCharge * 10 ** decimals);
}

async function createFeePayerATA(
  connection: Connection,
  tokenMint: PublicKey,
  feePayerWallet: Keypair,
  programId: PublicKey,
): Promise<boolean> {
  try {
    const feePayer = feePayerWallet.publicKey;
    const feePayerATA = getAssociatedTokenAddressSync(
      tokenMint,
      feePayer,
      false,
      programId,
    );

    const { blockhash } = await connection.getLatestBlockhash('finalized');

    const createATAInstruction = createAssociatedTokenAccountInstruction(
      feePayer,
      feePayerATA,
      feePayer,
      tokenMint,
      programId,
    );

    const computeBudgetInstructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 40000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
    ];

    const message = new TransactionMessage({
      payerKey: feePayer,
      recentBlockhash: blockhash,
      instructions: [...computeBudgetInstructions, createATAInstruction],
    }).compileToV0Message();

    const transaction = new VersionedTransaction(message);
    transaction.sign([feePayerWallet]);

    const signature = await connection.sendTransaction(transaction);
    const confirmation = await connection.confirmTransaction(
      signature,
      'confirmed',
    );

    if (confirmation.value.err) {
      logger.error(`${safeStringify(confirmation.value.err)}`);
      return false;
    }

    logger.info(`Created fee payer ATA: ${feePayerATA.toString()}`);
    return true;
  } catch (error) {
    if (error instanceof SendTransactionError) {
      logger.error(`${error.message}`);
      const logs = error.logs ? error.logs.join('\n') : 'No logs available';
      logger.error(`Transaction logs:\n${logs}`);
    } else {
      logger.error(`Error creating fee payer ATA: ${safeStringify(error)}`);
    }
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const sessionResponse = await getUserSession(headersList);

    if (sessionResponse.status !== 200 || !sessionResponse.data) {
      logger.warn(`Authentication failed: ${sessionResponse.error}`);
      return NextResponse.json(
        { error: sessionResponse.error },
        { status: sessionResponse.status },
      );
    }

    const { userId } = sessionResponse.data;
    const body = await request.json();

    logger.info(`Starting withdrawal process for user ${userId}`);
    const validatedBody = withdrawFormSchema.parse(body);
    const { recipientAddress, amount, tokenAddress } = validatedBody;
    logger.info(
      `req body: ${safeStringify({ recipientAddress, amount, tokenAddress })}`,
    );

    if (tokenAddress !== 'So11111111111111111111111111111111111111112') {
      if (!process.env.FEEPAYER_PRIVATE_KEY) {
        logger.error('Fee payer private key not configured');
        throw new Error('Fee payer private key not configured');
      }

      const feePayerWallet = Keypair.fromSecretKey(
        bs58.decode(process.env.FEEPAYER_PRIVATE_KEY as string),
      );
      const feePayer = feePayerWallet.publicKey;

      const connection = getConnection('confirmed');
      const tokenMint = new PublicKey(tokenAddress);

      const isToken2022 = await isToken2022Token(connection, tokenAddress);
      const programId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

      const feePayerATA = getAssociatedTokenAddressSync(
        tokenMint,
        feePayer,
        false,
        programId,
      );

      const feePayerATAExists =
        !!(await connection.getAccountInfo(feePayerATA));

      if (!feePayerATAExists) {
        const success = await createFeePayerATA(
          connection,
          tokenMint,
          feePayerWallet,
          programId,
        );

        if (!success) {
          logger.error('Failed to create fee payer ATA');
          throw new Error('Failed to create fee payer ATA');
        }

        logger.info('Fee payer ATA created successfully');
      }
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { walletAddress: true },
    });
    if (!user.walletAddress) throw new Error('User wallet address not found');

    const connection = getConnection('confirmed');
    const { blockhash } = await connection.getLatestBlockhash('finalized');

    const sender = new PublicKey(user.walletAddress);
    const recipient = new PublicKey(recipientAddress);
    const tokenMint = new PublicKey(tokenAddress);

    if (!process.env.FEEPAYER_PRIVATE_KEY)
      throw new Error('Fee payer private key not configured');

    const feePayerWallet = Keypair.fromSecretKey(
      bs58.decode(process.env.FEEPAYER_PRIVATE_KEY as string),
    );
    const feePayer = feePayerWallet.publicKey;

    if (tokenAddress === 'So11111111111111111111111111111111111111112') {
      const instructions = [
        SystemProgram.transfer({
          fromPubkey: sender,
          toPubkey: recipient,
          lamports: LAMPORTS_PER_SOL * Number(amount),
        }),
      ];
      const message = new TransactionMessage({
        payerKey: feePayer,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(message);
      transaction.sign([feePayerWallet]);

      return NextResponse.json({
        serializedTransaction: Buffer.from(transaction.serialize()).toString(
          'base64',
        ),
        receiverATAExists: true,
        ataCreationCost: 0,
      });
    }

    const isToken2022 = await isToken2022Token(connection, tokenAddress);
    const programId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

    const token = tokenList.find((e) => e.mintAddress === tokenAddress);
    if (!token) throw new Error('Invalid token selected');
    const decimals = token.decimals;

    const senderATA = getAssociatedTokenAddressSync(
      tokenMint,
      sender,
      false,
      programId,
    );
    const receiverATA = getAssociatedTokenAddressSync(
      tokenMint,
      recipient,
      false,
      programId,
    );
    const receiverATAExists = !!(await connection.getAccountInfo(receiverATA));
    const receiverATAWasMissing = !receiverATAExists;

    const feePayerATA = getAssociatedTokenAddressSync(
      tokenMint,
      feePayer,
      false,
      programId,
    );

    const allInstructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 40000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
    ];

    let ataCreationCost = 0;
    const withdrawAmount = Number(amount) * 10 ** decimals;

    if (receiverATAWasMissing) {
      ataCreationCost = await calculateAtaCreationCost(tokenAddress, decimals);
      logger.info(
        `ATA creation cost: ${ataCreationCost} tokens (${token.tokenSymbol})`,
      );

      allInstructions.push(
        createAssociatedTokenAccountInstruction(
          feePayer,
          receiverATA,
          recipient,
          tokenMint,
          programId,
        ),
      );

      if (ataCreationCost > 0) {
        allInstructions.push(
          createTransferInstruction(
            senderATA,
            feePayerATA,
            sender,
            ataCreationCost,
            [],
            programId,
          ),
        );
        allInstructions.push(
          createTransferInstruction(
            senderATA,
            receiverATA,
            sender,
            withdrawAmount - ataCreationCost,
            [],
            programId,
          ),
        );
      } else {
        allInstructions.push(
          createTransferInstruction(
            senderATA,
            receiverATA,
            sender,
            withdrawAmount,
            [],
            programId,
          ),
        );
      }
    } else {
      allInstructions.push(
        createTransferInstruction(
          senderATA,
          receiverATA,
          sender,
          withdrawAmount,
          [],
          programId,
        ),
      );
    }

    const message = new TransactionMessage({
      payerKey: feePayer,
      recentBlockhash: blockhash,
      instructions: allInstructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(message);
    transaction.sign([feePayerWallet]);

    const serializedTransaction = Buffer.from(transaction.serialize()).toString(
      'base64',
    );

    return NextResponse.json({
      serializedTransaction,
      receiverATAExists: !receiverATAWasMissing,
      ataCreationCost: receiverATAWasMissing ? ataCreationCost : 0,
    });
  } catch (error: any) {
    logger.error(
      `Failed to create transfer transaction: ${safeStringify(error)}`,
    );
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

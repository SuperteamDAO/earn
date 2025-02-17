import { Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const COMPUTE_BUDGET_ID = 'ComputeBudget111111111111111111111111111111';
const SYSTEM_PROGRAM_TRANSFER_ID = '11111111111111111111111111111111';
const ASSOCIATED_TOKEN_PROGRAM_ID =
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

const TOKEN_PROGRAM_TRANSFER_INSTRUCTION = 3;
const SYSTEM_PROGRAM_TRANSFER_INSTRUCTION = 2;

const ALLOWED_COMPUTE_BUDGET_INSTRUCTIONS = [0, 1, 2, 3];
const ALLOWED_PROGRAM_IDS = [
  TOKEN_PROGRAM_ID,
  COMPUTE_BUDGET_ID,
  SYSTEM_PROGRAM_TRANSFER_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
];

async function validateTransaction(
  transaction: VersionedTransaction,
  feePayerPubkey: PublicKey,
) {
  const instructions = transaction.message.compiledInstructions;
  if (instructions.length === 0) {
    throw new Error('Transaction must have at least one instruction');
  }

  for (const instruction of instructions) {
    const programId =
      transaction.message.staticAccountKeys[
        instruction.programIdIndex
      ]?.toBase58();
    if (!programId) {
      throw new Error('Program ID is undefined for instruction');
    }

    if (!ALLOWED_PROGRAM_IDS.includes(programId)) {
      throw new Error(`Invalid program ID detected: ${programId}`);
    }

    if (programId === TOKEN_PROGRAM_ID) {
      if (instruction.data[0] !== TOKEN_PROGRAM_TRANSFER_INSTRUCTION) {
        throw new Error('Only Token Program Transfer instructions are allowed');
      }

      const accountKeys = instruction.accountKeyIndexes.map(
        (index) => transaction.message.staticAccountKeys[index],
      );

      if (accountKeys.some((key) => key?.equals(feePayerPubkey))) {
        throw new Error('Fee payer cannot be used in token operations');
      }
    }

    if (programId === COMPUTE_BUDGET_ID) {
      const instructionType = instruction.data[0];
      if (instructionType === undefined) {
        throw new Error('Compute Budget instruction type is undefined');
      }
      if (!ALLOWED_COMPUTE_BUDGET_INSTRUCTIONS.includes(instructionType)) {
        throw new Error('Invalid Compute Budget instruction type');
      }
    }

    if (programId === SYSTEM_PROGRAM_TRANSFER_ID) {
      if (instruction.data[0] !== SYSTEM_PROGRAM_TRANSFER_INSTRUCTION) {
        throw new Error(
          'Only System Program Transfer instructions are allowed',
        );
      }
    }
  }
}

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const {
    userId,
    body: { serializedTransaction },
  } = req;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { walletAddress: true },
    });

    const transaction = VersionedTransaction.deserialize(
      Buffer.from(serializedTransaction, 'base64'),
    );

    const feePayerWallet = Keypair.fromSecretKey(
      bs58.decode(process.env.FEEPAYER_PRIVATE_KEY as string),
    );
    const feePayerPubkey = feePayerWallet.publicKey;
    const userWalletPubkey = new PublicKey(user.walletAddress as string);

    await validateTransaction(transaction, feePayerPubkey);

    const signers = transaction.message.staticAccountKeys.filter((_, index) =>
      transaction.message.isAccountSigner(index),
    );

    if (
      signers.length !== 2 ||
      !signers[0]?.equals(feePayerPubkey) ||
      !signers[1]?.equals(userWalletPubkey)
    ) {
      throw new Error('Invalid transaction signers');
    }

    transaction.sign([feePayerWallet]);

    return res.status(200).json({
      serializedTransaction: Buffer.from(transaction.serialize()).toString(
        'base64',
      ),
    });
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to sign transaction: ${safeStringify(error)}`,
    );

    let statusCode = 403;
    try {
      JSON.parse(error.message);
      statusCode = 400;
    } catch {}

    return res.status(statusCode).json({
      error: error.message,
      message: `Unable to sign transaction: ${error.message}`,
    });
  }
}

export default withAuth(handler);

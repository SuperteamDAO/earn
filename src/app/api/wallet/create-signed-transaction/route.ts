import {
  type Address,
  address,
  appendTransactionMessageInstructions,
  createKeyPairFromBytes,
  createNoopSigner,
  createSignerFromKeyPair,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  type Instruction,
  type KeyPairSigner,
  partiallySignTransactionMessageWithSigners,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type TransactionSigner,
} from '@solana/kit';
import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';
import { getTransferSolInstruction } from '@solana-program/system';
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenInstruction,
  getTransferCheckedInstruction,
  getTransferInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import bs58 from 'bs58';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { tokenList } from '@/constants/tokenList';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import { fetchTokenUSDValue } from '@/features/wallet/utils/fetchTokenUSDValue';
import { getRpc, type SolanaRpc } from '@/features/wallet/utils/getConnection';
import { withdrawFormSchema } from '@/features/wallet/utils/withdrawFormSchema';

const LAMPORTS_PER_SOL = 1_000_000_000n;

const tokenProgramCache: Record<string, string> = {};

async function isToken2022Token(
  rpc: SolanaRpc,
  mintAddress: string,
): Promise<boolean> {
  if (mintAddress === 'So11111111111111111111111111111111111111112') {
    return false;
  }
  if (tokenProgramCache[mintAddress]) {
    return tokenProgramCache[mintAddress] === TOKEN_2022_PROGRAM_ADDRESS;
  }
  try {
    const mintInfo = await rpc
      .getAccountInfo(address(mintAddress), { encoding: 'base64' })
      .send();
    if (!mintInfo.value) {
      logger.error(`Mint account not found: ${mintAddress}`);
      return false;
    }
    tokenProgramCache[mintAddress] = mintInfo.value.owner;
    return mintInfo.value.owner === TOKEN_2022_PROGRAM_ADDRESS;
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

function createAppropriateTransferInstruction(
  source: Address,
  destination: Address,
  authority: TransactionSigner,
  amount: bigint,
  mint: Address,
  decimals: number,
  isToken2022: boolean,
): Instruction {
  if (isToken2022) {
    return getTransferCheckedInstruction({
      source,
      mint,
      destination,
      authority,
      amount,
      decimals,
    });
  } else {
    return getTransferInstruction({
      source,
      destination,
      authority,
      amount,
    });
  }
}

async function createFeePayerATA(
  rpc: SolanaRpc,
  tokenMint: Address,
  feePayerSigner: KeyPairSigner,
  programId: Address,
): Promise<boolean> {
  try {
    const [feePayerATA] = await findAssociatedTokenPda({
      mint: tokenMint,
      owner: feePayerSigner.address,
      tokenProgram: programId,
    });

    const { value: latestBlockhash } = await rpc
      .getLatestBlockhash({ commitment: 'finalized' })
      .send();

    const createATAInstruction = getCreateAssociatedTokenInstruction({
      payer: feePayerSigner,
      ata: feePayerATA,
      owner: feePayerSigner.address,
      mint: tokenMint,
      tokenProgram: programId,
    });

    const computeBudgetInstructions = [
      getSetComputeUnitLimitInstruction({ units: 200000 }),
      getSetComputeUnitPriceInstruction({ microLamports: 100000n }),
    ];

    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(feePayerSigner, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) =>
        appendTransactionMessageInstructions(
          [...computeBudgetInstructions, createATAInstruction],
          tx,
        ),
    );

    const signedTransaction =
      await signTransactionMessageWithSigners(transactionMessage);

    const encodedTransaction =
      getBase64EncodedWireTransaction(signedTransaction);
    const signature = await rpc
      .sendTransaction(encodedTransaction, { skipPreflight: false })
      .send();

    const confirmation = await rpc.getSignatureStatuses([signature]).send();

    if (confirmation.value[0]?.err) {
      logger.error(`${safeStringify(confirmation.value[0].err)}`);
      return false;
    }

    logger.info(`Created fee payer ATA: ${feePayerATA}`);
    return true;
  } catch (error) {
    logger.error(`Error creating fee payer ATA: ${safeStringify(error)}`);
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

    const rpc = getRpc();

    if (!process.env.FEEPAYER_PRIVATE_KEY) {
      logger.error('Fee payer private key not configured');
      throw new Error('Fee payer private key not configured');
    }

    const feePayerKeyPair = await createKeyPairFromBytes(
      bs58.decode(process.env.FEEPAYER_PRIVATE_KEY),
    );
    const feePayerSigner = await createSignerFromKeyPair(feePayerKeyPair);

    if (tokenAddress !== 'So11111111111111111111111111111111111111112') {
      const tokenMint = address(tokenAddress);

      const isToken2022 = await isToken2022Token(rpc, tokenAddress);
      const programId = isToken2022
        ? TOKEN_2022_PROGRAM_ADDRESS
        : TOKEN_PROGRAM_ADDRESS;

      const [feePayerATA] = await findAssociatedTokenPda({
        mint: tokenMint,
        owner: feePayerSigner.address,
        tokenProgram: programId,
      });

      const feePayerATAInfo = await rpc
        .getAccountInfo(feePayerATA, { encoding: 'base64' })
        .send();
      const feePayerATAExists = !!feePayerATAInfo.value;

      if (!feePayerATAExists) {
        const success = await createFeePayerATA(
          rpc,
          tokenMint,
          feePayerSigner,
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

    const { value: latestBlockhash } = await rpc
      .getLatestBlockhash({ commitment: 'finalized' })
      .send();

    const senderAddress = address(user.walletAddress);
    const senderSigner = createNoopSigner(senderAddress);
    const recipient = address(recipientAddress);
    const tokenMint = address(tokenAddress);

    if (tokenAddress === 'So11111111111111111111111111111111111111112') {
      const lamportsAmount = BigInt(
        Math.floor(Number(amount) * Number(LAMPORTS_PER_SOL)),
      );
      const instructions = [
        getTransferSolInstruction({
          source: senderSigner,
          destination: recipient,
          amount: lamportsAmount,
        }),
      ];

      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(feePayerSigner, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstructions(instructions, tx),
      );

      const partiallySignedTransaction =
        await partiallySignTransactionMessageWithSigners(transactionMessage);

      return NextResponse.json({
        serializedTransaction: getBase64EncodedWireTransaction(
          partiallySignedTransaction,
        ),
        receiverATAExists: true,
        ataCreationCost: 0,
      });
    }

    const isToken2022 = await isToken2022Token(rpc, tokenAddress);
    const programId = isToken2022
      ? TOKEN_2022_PROGRAM_ADDRESS
      : TOKEN_PROGRAM_ADDRESS;

    const token = tokenList.find((e) => e.mintAddress === tokenAddress);
    if (!token) throw new Error('Invalid token selected');
    const decimals = token.decimals;

    const [senderATA] = await findAssociatedTokenPda({
      mint: tokenMint,
      owner: senderAddress,
      tokenProgram: programId,
    });
    const [receiverATA] = await findAssociatedTokenPda({
      mint: tokenMint,
      owner: recipient,
      tokenProgram: programId,
    });
    const receiverATAInfo = await rpc
      .getAccountInfo(receiverATA, { encoding: 'base64' })
      .send();
    const receiverATAExists = !!receiverATAInfo.value;
    const receiverATAWasMissing = !receiverATAExists;

    const [feePayerATA] = await findAssociatedTokenPda({
      mint: tokenMint,
      owner: feePayerSigner.address,
      tokenProgram: programId,
    });

    const allInstructions: Instruction[] = [
      getSetComputeUnitLimitInstruction({ units: 200000 }),
      getSetComputeUnitPriceInstruction({ microLamports: 500000n }),
    ];

    let ataCreationCost = 0;
    const withdrawAmount = Math.floor(Number(amount) * 10 ** decimals);
    if (!Number.isFinite(withdrawAmount) || withdrawAmount <= 0) {
      throw new Error('Amount is below the smallest unit');
    }

    if (receiverATAWasMissing) {
      ataCreationCost = await calculateAtaCreationCost(tokenAddress, decimals);
      logger.info(
        `ATA creation cost: ${ataCreationCost} tokens (${token.tokenSymbol})`,
      );

      allInstructions.push(
        getCreateAssociatedTokenInstruction({
          payer: feePayerSigner,
          ata: receiverATA,
          owner: recipient,
          mint: tokenMint,
          tokenProgram: programId,
        }),
      );

      if (ataCreationCost > 0) {
        if (withdrawAmount <= ataCreationCost) {
          throw new Error(
            'Amount must be greater than associated token account creation fee',
          );
        }
        allInstructions.push(
          createAppropriateTransferInstruction(
            senderATA,
            feePayerATA,
            senderSigner,
            BigInt(ataCreationCost),
            tokenMint,
            decimals,
            isToken2022,
          ),
        );
        allInstructions.push(
          createAppropriateTransferInstruction(
            senderATA,
            receiverATA,
            senderSigner,
            BigInt(withdrawAmount - ataCreationCost),
            tokenMint,
            decimals,
            isToken2022,
          ),
        );
      } else {
        allInstructions.push(
          createAppropriateTransferInstruction(
            senderATA,
            receiverATA,
            senderSigner,
            BigInt(withdrawAmount),
            tokenMint,
            decimals,
            isToken2022,
          ),
        );
      }
    } else {
      allInstructions.push(
        createAppropriateTransferInstruction(
          senderATA,
          receiverATA,
          senderSigner,
          BigInt(withdrawAmount),
          tokenMint,
          decimals,
          isToken2022,
        ),
      );
    }

    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(feePayerSigner, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstructions(allInstructions, tx),
    );

    const partiallySignedTransaction =
      await partiallySignTransactionMessageWithSigners(transactionMessage);

    const serializedTransaction = getBase64EncodedWireTransaction(
      partiallySignedTransaction,
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

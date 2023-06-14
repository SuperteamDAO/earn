/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
import type { Program } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import type NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';
import * as spl from '@solana/spl-token';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

import { type EarnReloaded, IDL } from './program';

const PROGRAM_ID = process.env.NEXT_PUBLIC_PAYMENT_PROGRAM_ID || '';
const RPC_URL = process.env.NEXT_PUBLIC_PAYMENT_RPC_URL || '';

export const connection = new anchor.web3.Connection(RPC_URL, 'confirmed');

export const getProvider = (wallet: anchor.Wallet) => {
  const opts = {
    preflightCommitment: 'processed' as anchor.web3.ConfirmOptions,
  };

  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    opts.preflightCommitment
  );
  return provider;
};

export const anchorProgram = (wallet: anchor.Wallet) => {
  const provider = getProvider(wallet);
  const idl = IDL as anchor.Idl;
  const program = new anchor.Program(
    idl,
    PROGRAM_ID,
    provider
  ) as unknown as Program<EarnReloaded>;

  return program;
};
export const createPaymentSPL = async (
  anchorWallet: NodeWallet,
  receiver: anchor.web3.PublicKey,
  amount: number,
  token: anchor.web3.PublicKey,
  id: string
) => {
  const program = anchorProgram(anchorWallet);
  const [payout_account] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode('payout'),
      anchor.utils.bytes.utf8.encode(id),
      token.toBuffer(),
      receiver.toBuffer(),
    ],
    program.programId
  );
  const receiver_usdc_ata = await spl.getAssociatedTokenAddress(
    token,
    receiver,
    false,
    spl.TOKEN_PROGRAM_ID,
    spl.ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const usdc_ata = await spl.getAssociatedTokenAddress(
    token,
    anchorWallet.publicKey,
    false,
    spl.TOKEN_PROGRAM_ID,
    spl.ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const info = await connection.getAccountInfo(receiver_usdc_ata);
  let tokenAccountIx;
  if (!info) {
    tokenAccountIx = spl.createAssociatedTokenAccountInstruction(
      anchorWallet.publicKey,
      receiver_usdc_ata,
      receiver,
      token
    );
  }
  const ix = await program.methods
    .payout(id, receiver, new anchor.BN(amount))
    .accounts({
      authority: anchorWallet.publicKey,
      tokenAtaReceiver: receiver_usdc_ata,
      tokenAtaSender: usdc_ata,
      tokenMint: token,
      payoutAccount: payout_account,
      associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
    })
    .instruction();

  return [ix, tokenAccountIx];
};

export const createPaymentSOL = async (
  anchorWallet: NodeWallet,
  receiver: anchor.web3.PublicKey,
  amount: number,
  id: string
) => {
  const program = anchorProgram(anchorWallet);

  const [payout_account] = await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode('payout'),
      anchor.utils.bytes.utf8.encode(id),
      anchor.utils.bytes.utf8.encode('sol'),
      receiver.toBuffer(),
    ],
    program.programId
  );
  const ix = await program.methods
    .payoutSol(id, receiver, new anchor.BN(amount * LAMPORTS_PER_SOL))
    .accounts({
      authority: anchorWallet.publicKey,
      payoutAccount: payout_account,
      receiverAccount: receiver,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
    })
    .instruction();

  return ix;
};

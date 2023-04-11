/* eslint-disable @typescript-eslint/naming-convention */
import type { Program } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import type NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';
import * as spl from '@solana/spl-token';

import type { ContractType } from './program';
import { Contract } from './program';

const PROGRAM_ID = '9X22YWBVvXwiAB2GNDxWU2EmDsUrsXwmkG1e4zJUt7We';
const RPC_URL = 'https://api.devnet.solana.com';

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
  const idl = Contract as anchor.Idl;
  const program = new anchor.Program(
    idl,
    PROGRAM_ID,
    provider
  ) as unknown as Program<ContractType>;

  return program;
};
export const createPayment = async (
  anchorWallet: NodeWallet,
  receiver: anchor.web3.PublicKey,
  amount: number,
  token: anchor.web3.PublicKey,
  count: number
) => {
  const program = anchorProgram(anchorWallet);
  const [payout_account] = await anchor.web3.PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode('payout'),
      anchor.utils.bytes.utf8.encode(JSON.stringify(count)),
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
  const ix = await program.methods
    .payout(JSON.stringify(count), receiver, new anchor.BN(amount))
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

  return ix;
};

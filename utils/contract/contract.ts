import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';
import { Contract, ContractType } from './program';
import * as spl from '@solana/spl-token';

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
  let [payout_account, bump] = await anchor.web3.PublicKey.findProgramAddress(
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
  let ix = await program.methods
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

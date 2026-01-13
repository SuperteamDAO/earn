import { createSolanaRpc, type Rpc, type SolanaRpcApi } from '@solana/kit';
import { type Commitment, Connection } from '@solana/web3.js';

let connectionInstance: Connection | null = null;
export type SolanaRpc = Rpc<SolanaRpcApi>;

export function getConnection(
  commitment: Commitment = 'confirmed',
): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(
      `https://${process.env.NEXT_PUBLIC_RPC_URL}`,
      commitment,
    );
  }
  return connectionInstance;
}

let rpcInstance: SolanaRpc | null = null;

export function getRpc(): SolanaRpc {
  if (!rpcInstance) {
    rpcInstance = createSolanaRpc(`https://${process.env.NEXT_PUBLIC_RPC_URL}`);
  }
  return rpcInstance;
}

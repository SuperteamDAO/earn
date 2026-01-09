import { createSolanaRpc, type Rpc, type SolanaRpcApi } from '@solana/kit';

export type SolanaRpc = Rpc<SolanaRpcApi>;

let rpcInstance: SolanaRpc | null = null;

export function getRpc(): SolanaRpc {
  if (!rpcInstance) {
    rpcInstance = createSolanaRpc(`https://${process.env.NEXT_PUBLIC_RPC_URL}`);
  }
  return rpcInstance;
}

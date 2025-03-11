import { type Commitment, Connection } from '@solana/web3.js';

let connectionInstance: Connection | null = null;

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

import { type Connection } from '@solana/web3.js';

export const pollForSignature = async (sig: string, connection: Connection) => {
  const MAX_RETRIES = 60;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    const status = await connection.getSignatureStatus(sig, {
      searchTransactionHistory: true,
    });

    if (status?.value?.err) {
      console.log(status.value.err);
      throw new Error(`Transaction failed: ${status.value.err.toString()}`);
    }

    if (
      status?.value?.confirmationStatus === 'confirmed' ||
      status.value?.confirmationStatus === 'finalized'
    ) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    retries++;
  }

  throw new Error('Transaction confirmation timeout');
};

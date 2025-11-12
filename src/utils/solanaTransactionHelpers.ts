import { type Connection } from '@solana/web3.js';
import { toast } from 'sonner';

export function classifySolanaError(
  error: unknown,
):
  | 'user-rejected'
  | 'expired'
  | 'timeout'
  | 'rpc'
  | 'insufficient-funds'
  | 'token-not-available'
  | 'unknown' {
  const text = String((error as any)?.message ?? error ?? '').toLowerCase();
  if (
    text.includes('user rejected') ||
    text.includes('rejected the request') ||
    text.includes('denied') ||
    text.includes('declined')
  ) {
    return 'user-rejected';
  }
  if (
    text.includes('expired') ||
    text.includes('blockhash') ||
    text.includes('lastvalidblockheight')
  ) {
    return 'expired';
  }
  if (
    text.includes('timed out') ||
    text.includes('timeout') ||
    text.includes('was not confirmed')
  ) {
    return 'timeout';
  }
  if (
    text.includes('failed to fetch') ||
    text.includes('429') ||
    text.includes('503') ||
    text.includes('network') ||
    text.includes('econnreset') ||
    text.includes('enotfound')
  ) {
    return 'rpc';
  }
  if (
    text.includes('insufficient') ||
    text.includes('insufficient token balance') ||
    text.includes('insufficient funds')
  ) {
    return 'insufficient-funds';
  }
  if (text.includes('check token requirements')) {
    return 'token-not-available';
  }
  return 'unknown';
}

interface WaitForConfirmationOptions {
  connection: Connection;
  signature: string;
  lastValidBlockHeight?: number;
  rawBytes?: Uint8Array | null;
  maxRetries?: number;
  retryDelayMs?: number;
}

export async function waitForTransactionConfirmation({
  connection,
  signature,
  lastValidBlockHeight,
  rawBytes,
  maxRetries = 60,
  retryDelayMs = 1500,
}: WaitForConfirmationOptions): Promise<void> {
  let retries = 0;

  while (retries < maxRetries) {
    const statuses = await connection.getSignatureStatuses([signature]);
    const status = statuses?.value?.[0];

    if (status?.err) {
      throw new Error(`Transaction failed: ${String(status.err)}`);
    }

    if (
      status?.confirmationStatus === 'confirmed' ||
      status?.confirmationStatus === 'finalized'
    ) {
      return;
    }

    if (lastValidBlockHeight !== undefined) {
      const currentBlockHeight = await connection.getBlockHeight();
      if (currentBlockHeight > lastValidBlockHeight) {
        throw new Error('Blockhash expired before confirmation');
      }
    }

    if (rawBytes) {
      try {
        await connection.sendRawTransaction(rawBytes, {
          skipPreflight: true,
          maxRetries: 0,
        });
      } catch {}
    }

    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    retries++;
  }

  throw new Error('Transaction confirmation timeout');
}

interface TransactionGuardOptions {
  guardKey: string;
  inFlightMessage?: string;
}

export function createTransactionGuard({
  guardKey,
  inFlightMessage,
}: TransactionGuardOptions): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  const inFlight = window.localStorage.getItem(guardKey);
  if (inFlight) {
    if (inFlightMessage) {
      toast.info(inFlightMessage);
    }
    return false;
  }

  window.localStorage.setItem(guardKey, 'in-progress');
  return true;
}

export function updateTransactionGuard(
  guardKey: string,
  signature: string,
): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(guardKey, signature);
  }
}

export function cleanupTransactionGuards(prefix: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {}
}

interface HandleSolanaErrorOptions {
  errorType: ReturnType<typeof classifySolanaError>;
  lastSignature?: string | null;
  tokenSymbol?: string;
  customMessages?: {
    userRejected?: string;
    expired?: string;
    insufficientFunds?: string;
    tokenNotAvailable?: string;
    timeout?: string;
    rpc?: string;
    unknown?: string;
  };
}

export function handleSolanaError({
  errorType,
  lastSignature,
  tokenSymbol,
  customMessages,
}: HandleSolanaErrorOptions): void {
  switch (errorType) {
    case 'user-rejected':
      toast.error(
        customMessages?.userRejected ?? 'Transaction cancelled in wallet.',
      );
      break;
    case 'expired':
      toast.error(
        customMessages?.expired ?? 'Blockhash expired. Transaction not sent.',
      );
      break;
    case 'insufficient-funds':
    case 'token-not-available': {
      const symbol = tokenSymbol ?? 'token';
      toast.error(
        customMessages?.insufficientFunds ??
          customMessages?.tokenNotAvailable ??
          `Insufficient ${symbol} or SOL balance. Please add funds to your wallet and try again.`,
      );
      break;
    }
    case 'timeout': {
      if (lastSignature && lastSignature.length > 0) {
        toast.info(
          customMessages?.timeout ??
            'Network congestion: transaction may still confirm. Check explorer.',
        );
      } else {
        toast.info(
          'Network congestion: transaction may still confirm. Please check your wallet history before retrying.',
        );
      }
      break;
    }
    case 'rpc':
    case 'unknown':
    default:
      toast.error(
        customMessages?.rpc ??
          customMessages?.unknown ??
          'Something went wrong. Please try again. If the issue persists, contact support.',
      );
      break;
  }
}

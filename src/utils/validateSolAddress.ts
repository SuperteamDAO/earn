import { PublicKey } from '@solana/web3.js';

export function validateSolanaAddress(address: string) {
  try {
    const pubkey = new PublicKey(address);
    const isSolana = PublicKey.isOnCurve(pubkey.toBuffer());

    if (!isSolana) {
      return {
        isValid: false,
        error: 'Invalid Solana address',
      };
    }

    return {
      isValid: true,
    };
  } catch (err) {
    return {
      isValid: false,
      error: 'Invalid Solana address',
    };
  }
}

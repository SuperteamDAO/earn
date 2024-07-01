import { PublicKey } from '@solana/web3.js';

export function validateSolAddress(
  address: string,
  setError: (arg0: string) => void,
) {
  try {
    const pubkey = new PublicKey(address);
    const isSolana = PublicKey.isOnCurve(pubkey.toBuffer());
    if (!isSolana) {
      setError('Please enter a valid Solana address');
      return false;
    }
    return true;
  } catch (err) {
    setError('Please enter a valid Solana address');
    return false;
  }
}

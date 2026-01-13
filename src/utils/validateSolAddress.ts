import { isAddress } from '@solana/kit';

export function validateSolAddress(address: string): boolean {
  return isAddress(address);
}

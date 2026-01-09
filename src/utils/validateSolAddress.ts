import { isAddress } from '@solana/kit';

export function validateSolAddress(addr: string): boolean {
  return isAddress(addr);
}

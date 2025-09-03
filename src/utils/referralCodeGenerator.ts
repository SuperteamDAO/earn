import { randomBytes } from 'crypto';

import { prisma } from '@/prisma';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateCandidate = (length = 7): string => {
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    const byte = bytes[i] ?? 0;
    result += ALPHABET[byte % ALPHABET.length];
  }
  return result;
};

export const generateUniqueReferralCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateCandidate(7);
    const exists = await prisma.user.findUnique({
      where: { referralCode: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }

  while (true) {
    const candidate = generateCandidate(7);
    const exists = await prisma.user.findUnique({
      where: { referralCode: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
};

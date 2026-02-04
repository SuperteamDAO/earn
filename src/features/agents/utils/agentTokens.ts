import { createHash, randomBytes } from 'crypto';

const API_KEY_PREFIX = 'sk_';
const API_KEY_BYTES = 32;
const CLAIM_CODE_BYTES = 4;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateApiKey() {
  const apiKey = `${API_KEY_PREFIX}${randomBytes(API_KEY_BYTES).toString('hex')}`;
  return {
    apiKey,
    apiKeyHash: hashToken(apiKey),
    apiKeyPrefix: apiKey.slice(0, 8),
  };
}

export function generateClaimCode() {
  const claimCode = randomBytes(CLAIM_CODE_BYTES).toString('hex').toUpperCase();
  return {
    claimCode,
    claimCodeHash: hashToken(claimCode),
    claimCodePrefix: claimCode.slice(0, 4),
  };
}

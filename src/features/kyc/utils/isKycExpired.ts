import { SIX_MONTHS } from '@/constants/SIX_MONTHS';

type KycExpiryInput = {
  kycVerifiedAt?: Date | string | null;
  kycExpiresAt?: Date | string | null;
};

const toValidDate = (value?: Date | string | null): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isKycExpired = ({
  kycVerifiedAt,
  kycExpiresAt,
}: KycExpiryInput): boolean => {
  const expiryDate = toValidDate(kycExpiresAt);
  if (expiryDate) {
    return Date.now() >= expiryDate.getTime();
  }

  const verifiedAtDate = toValidDate(kycVerifiedAt);
  if (!verifiedAtDate) {
    return true;
  }

  return Date.now() - verifiedAtDate.getTime() > SIX_MONTHS;
};

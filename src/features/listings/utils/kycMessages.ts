// What the submission KYC page, framed in the listing page's KYC modal,
// tells the page: its height, that a verdict is being checked, a toast to
// show, that the check found no verdict yet, or that the KYC is verified.
export const LISTING_KYC_MESSAGE = 'earn-listing-kyc';

export type ListingKycMessage =
  | {
      readonly type: typeof LISTING_KYC_MESSAGE;
      readonly kind: 'height';
      readonly height: number;
    }
  | {
      readonly type: typeof LISTING_KYC_MESSAGE;
      readonly kind: 'error';
      readonly message: string;
    }
  | {
      readonly type: typeof LISTING_KYC_MESSAGE;
      readonly kind: 'checking' | 'pending' | 'verified';
    };

export const isListingKycMessage = (data: unknown): data is ListingKycMessage =>
  typeof data === 'object' &&
  data !== null &&
  'type' in data &&
  data.type === LISTING_KYC_MESSAGE &&
  'kind' in data &&
  (data.kind === 'checking' ||
    data.kind === 'pending' ||
    data.kind === 'verified' ||
    (data.kind === 'height' &&
      'height' in data &&
      typeof data.height === 'number') ||
    (data.kind === 'error' &&
      'message' in data &&
      typeof data.message === 'string'));

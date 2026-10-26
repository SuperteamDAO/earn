// What the KYC page, framed in the grant page's KYC modal, tells the page:
// its height, a toast to show, or that the KYC is verified.
export const GRANT_KYC_MESSAGE = 'earn-grant-kyc';

export type GrantKycMessage =
  | {
      readonly type: typeof GRANT_KYC_MESSAGE;
      readonly kind: 'height';
      readonly height: number;
    }
  | {
      readonly type: typeof GRANT_KYC_MESSAGE;
      readonly kind: 'error';
      readonly message: string;
    }
  | { readonly type: typeof GRANT_KYC_MESSAGE; readonly kind: 'verified' };

export const isGrantKycMessage = (data: unknown): data is GrantKycMessage =>
  typeof data === 'object' &&
  data !== null &&
  'type' in data &&
  data.type === GRANT_KYC_MESSAGE &&
  'kind' in data &&
  (data.kind === 'verified' ||
    (data.kind === 'height' &&
      'height' in data &&
      typeof data.height === 'number') ||
    (data.kind === 'error' &&
      'message' in data &&
      typeof data.message === 'string'));

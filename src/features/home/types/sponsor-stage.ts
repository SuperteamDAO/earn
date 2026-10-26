import type { Listing } from '@/features/listings/types';

export enum SponsorStage {
  NEW_SPONSOR = 'NEW_SPONSOR',
  REVIEW = 'REVIEW',
  REVIEW_URGENT = 'REVIEW_URGENT',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  NEXT_LISTING = 'NEXT_LISTING',
  UNDER_VERIFICATION = 'UNDER_VERIFICATION',
}

export interface SponsorStageResponse {
  stage: SponsorStage | null;
  listing: Listing | null;
}

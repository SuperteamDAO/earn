import { type Listing } from '@/features/listings/types';

export enum SponsorStage {
  NEW_SPONSOR = 'NEW_SPONSOR',
  BOOST = 'BOOST',
  BOOSTED = 'BOOSTED',
  REVIEW_AI = 'REVIEW_AI',
  REVIEW = 'REVIEW',
  REVIEW_URGENT = 'REVIEW_URGENT',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  NEXT_LISTING = 'NEXT_LISTING',
}

export interface SponsorStageResponse {
  stage: SponsorStage | null;
  listing: Listing | null;
}

import type { CommentRefType } from '@/prisma/enums';

import type { FeedPostType } from '../types';

const COMMENT_REF_TYPES: Record<FeedPostType, CommentRefType> = {
  submission: 'SUBMISSION',
  pow: 'POW',
  'grant-application': 'GRANT_APPLICATION',
};

export const convertFeedPostTypeToCommentRefType = (
  feedPostType: FeedPostType,
): CommentRefType => COMMENT_REF_TYPES[feedPostType];

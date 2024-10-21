import { type CommentRefType } from '@prisma/client';

import { type FeedPostType } from '../types';

export const convertFeedPostTypeToCommentRefType = (
  feedPostType: FeedPostType,
): CommentRefType => {
  switch (feedPostType) {
    case 'submission':
      return 'SUBMISSION';
    case 'pow':
      return 'POW';
    case 'grant-application':
      return 'GRANT_APPLICATION';
  }
};

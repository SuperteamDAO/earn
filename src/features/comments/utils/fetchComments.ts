import { prisma } from '@/prisma';

import { USERNAME_PATTERN } from '@/features/talent/constants';

type FetchCommentsParams = {
  refId: string;
  skip?: number;
  take?: number;
};

export async function fetchComments({
  refId,
  skip = 0,
  take = 0,
}: FetchCommentsParams) {
  const result = await prisma.comment.findMany({
    where: {
      refId,
      isActive: true,
      isArchived: false,
      replyToId: null,
      type: {
        not: 'SUBMISSION',
      },
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    skip: skip ?? 0,
    take,
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
          photo: true,
          username: true,
          currentSponsorId: true,
          isPro: true,
        },
      },
      replies: {
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              photo: true,
              username: true,
              currentSponsorId: true,
              isPro: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  const commentsCount = await prisma.comment.count({
    where: {
      refId,
      isActive: true,
      isArchived: false,
      replyToId: null,
      type: {
        not: 'SUBMISSION',
      },
    },
  });

  const mentionedUsernames = extractUsernames(result);
  const validUsernames = await prisma.user.findMany({
    where: {
      username: {
        in: Array.from(mentionedUsernames),
      },
    },
    select: {
      username: true,
    },
  });

  return {
    count: commentsCount,
    result,
    validUsernames: validUsernames.map((user) => user.username).filter(Boolean),
  };
}

function extractUsernames(
  comments: Array<{ message: string; replies?: any[] }>,
) {
  const usernames = new Set<string>();

  const processMessage = (message: string) => {
    const matches = message.match(/@([\w-]+)/g);
    if (matches) {
      matches.forEach((match) => {
        const username = match.slice(1);
        if (username && USERNAME_PATTERN.test(username)) {
          usernames.add(username);
        }
      });
    }
  };

  comments.forEach((comment) => {
    processMessage(comment.message);
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach((reply: { message: string }) => {
        processMessage(reply.message);
      });
    }
  });

  return usernames;
}

import type { Prisma } from '@prisma/client';

type SubmissionWithUser = Prisma.SubmissionGetPayload<{
  include: {
    user: true;
  };
}>;
export type { SubmissionWithUser };

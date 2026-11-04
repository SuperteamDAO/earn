import { type UserGetPayload, type UserSelect } from '@/prisma/models/User';

export const scoutUserSelect = {
  stRecommended: true,
  firstName: true,
  lastName: true,
  username: true,
  photo: true,
} satisfies UserSelect;

export type ScoutUserResponse = UserGetPayload<{
  select: typeof scoutUserSelect;
}>;

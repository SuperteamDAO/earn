import type { User } from '@/interface/user';
import { type CommentRefType } from '@/prisma/enums';

export type CommentType =
  | 'NORMAL'
  | 'SUBMISSION'
  | 'DEADLINE_EXTENSION'
  | 'WINNER_ANNOUNCEMENT';

export interface Comment {
  id: string;
  type: CommentType;
  message: string;
  authorId: string;
  replyToId: string | null;
  replies: Comment[];
  submissionId?: string | null;
  author: User;
  refId: string;
  refType: CommentRefType;
  updatedAt: Date;
  createdAt: Date;
  isPinned: boolean;
}

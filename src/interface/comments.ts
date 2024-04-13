import type { User } from '@/interface/user';

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
  replyToId: string;
  replies: Comment[];
  submissionId?: string;
  author: User;
  refId: string;
  refType: 'BOUNTY' | 'SUBMISSION';
  updatedAt: Date;
}

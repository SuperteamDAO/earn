import type { User } from '@/interface/user';

export interface Comment {
  id: string;
  message: string;
  authorId: string;
  replyToId: string;
  replies: Comment[];
  author: User;
  refId: string;
  refType: 'BOUNTY' | 'SUBMISSION';
  updatedAt: Date;
}

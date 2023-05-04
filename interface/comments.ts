import type { User } from '@/interface/user';

export interface Comment {
  id: string;
  message: string;
  authorId: string;
  author: User;
  refId: string;
  refType: 'BOUNTY' | 'JOB';
}

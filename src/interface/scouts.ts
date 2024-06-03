import { type User } from './user';

interface Scouts {
  id: string;
  userId: string;
  listingId: string;
  dollarsEarned: number;
  score: number;
  invited: boolean;
  skills: string[];
  createdAt: Date;
  user: User;
}

export type { Scouts };

import { type NextApiRequest } from 'next';

export interface NextApiRequestWithUser extends NextApiRequest {
  userId?: string;
}

export interface NextApiRequestWithSponsor extends NextApiRequest {
  userId?: string;
  role?: string;
  userSponsorId?: string;
  hackathonId?: string;
}

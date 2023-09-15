import type { JWTPayload } from 'jose';

export type AuthPayload = {
  id: string;
  username: string;
  profilePicture: string;
  wallet: string;
} & JWTPayload;

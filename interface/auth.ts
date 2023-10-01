import type { SuperRole } from '@prisma/client';
import type { JWTPayload } from 'jose';

export type AuthPayload = {
  id: string;
  username: string;
  profilePicture: string;
  wallet: string;
  type: SuperRole;
  firstName: string;
  lastName: string;
} & JWTPayload;

export interface AuthCheckReturn {
  data: {
    type: 'NEW_WALLET' | 'EXISTING_USER';
    user?: AuthPayload | null;
  } | null;
  error: string | null;
}

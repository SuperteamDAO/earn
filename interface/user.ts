interface User {
  id?: string;
  publicKey?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  talent?: boolean;
  sponsor?: boolean;
}
export type { User };

import type { User } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    token: any;
    user: User & {
      isSponsor: boolean;
      firstName: any;
      lastName: any;
      photo: any;
    };
  }
}

// declare module 'next-auth/jwt' {
//   type JWT = User;
// }

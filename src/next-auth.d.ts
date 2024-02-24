import type { User } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    token: any;
    user: User & {
      id: any;
      firstName: any;
      lastName: any;
      photo: any;
      role: any;
    };
  }
}

// declare module 'next-auth/jwt' {
//   type JWT = User;
// }

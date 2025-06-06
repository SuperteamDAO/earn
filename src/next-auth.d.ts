import type { User } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    token: any;
    user: User & {
      id: any;
      name: any;
      photo: any;
      role: any;
      location: any;
    };
  }
}

// declare module 'next-auth/jwt' {
//   type JWT = User;
// }

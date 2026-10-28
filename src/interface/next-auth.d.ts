import { type DefaultSession } from 'next-auth';

// Fields the X-linking callbacks in pages/api/auth/[...nextauth].ts attach.
declare module 'next-auth' {
  interface User {
    twitterHandle?: string;
  }

  interface Session {
    user?: DefaultSession['user'] & {
      id?: string;
      linkedTwitter?: string[];
    };
  }
}

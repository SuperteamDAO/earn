/* eslint-disable no-param-reassign */
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import GoogleProvider from 'next-auth/providers/google';

import { prisma } from '@/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: Number(profile.sub),
          firstName: profile.given_name,
          lastName: profile.family_name,
          email: profile.email,
          emailVerified: profile.emailVerified,
          isVerified: true,
        } as any;
      },
    }),
  ],
  secret: process.env.SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log(token, user);
      return { ...token, ...user };
    },
    async session({ session, token }) {
      console.log(session, token);
      session.user.isSponsor = !!token.currentSponsorId;
      return session;
    },
  },
  pages: {
    error: '/email',
  },
};

export default NextAuth(authOptions);

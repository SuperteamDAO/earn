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
    async jwt({ token, user, account }) {
      return { ...token, ...user, ...account };
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.photo = token.photo;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.user.isSponsor = !!token.currentSponsorId;
      session.token = token.access_token;
      return session;
    },
  },
  pages: {
    error: '/email',
  },
};

export default NextAuth(authOptions);

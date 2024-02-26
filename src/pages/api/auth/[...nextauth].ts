import { PrismaAdapter } from '@next-auth/prisma-adapter';
import NextAuth, { type NextAuthOptions } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';

import { kashEmail, MagicLinkTemplate, resend } from '@/features/emails';
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
        } as any;
      },
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: process.env.RESEND_EMAIL,
      sendVerificationRequest: async ({ identifier, url }) => {
        await resend.emails.send({
          from: kashEmail,
          to: [identifier],
          subject: 'Log in to Superteam Earn',
          react: MagicLinkTemplate({ loginUrl: url }),
        });
      },
    }),
  ],
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
      session.token = token.access_token;
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    verifyRequest: '/verify-request',
    newUser: '/new',
  },
};

export default NextAuth(authOptions);

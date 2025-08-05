import type { NextApiRequest, NextApiResponse } from 'next';
import NextAuth, { type NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

import { prisma } from '@/prisma';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { normalizeTwitterHandle } from '@/features/social/utils/twitter-verification';

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  const authOptions: NextAuthOptions = {
    providers: [
      TwitterProvider({
        clientId: process.env.TWITTER_CLIENT_ID!,
        clientSecret: process.env.TWITTER_CLIENT_SECRET!,
        version: '2.0',
        authorization: {
          url: 'https://x.com/i/oauth2/authorize',
        },
        token: 'https://api.x.com/2/oauth2/token',
      }),
    ],

    pages: { error: '/auth/error', signIn: '/auth/error' },

    callbacks: {
      async signIn({ user, account, profile }) {
        if (account?.provider === 'twitter') {
          if (!profile) {
            console.warn('[NextAuth] No profile found from Twitter');
            return true;
          }

          const rawHandle =
            (profile as any)?.username ||
            (profile as any)?.data?.username ||
            (profile as any)?.screen_name ||
            '';

          if (rawHandle) {
            const handle = normalizeTwitterHandle(rawHandle);
            console.log(`[NextAuth] Extracted Twitter handle: ${handle}`);

            (user as any).twitterHandle = handle;
          } else {
            console.warn('[NextAuth] No Twitter username found in profile');
          }
        }

        return true;
      },

      async jwt({ token, user }) {
        if ((user as any)?.twitterHandle) {
          token.twitterHandle = (user as any).twitterHandle;
        }

        if (token.twitterHandle) {
          try {
            const privyDid = await getPrivyToken(req);

            if (privyDid) {
              const existingUser = await prisma.user.findUnique({
                where: { privyDid },
                select: { id: true, linkedTwitter: true },
              });

              if (existingUser) {
                const currentLinkedTwitter = existingUser.linkedTwitter as
                  | string[]
                  | null;
                const alreadyLinked =
                  currentLinkedTwitter?.includes(
                    token.twitterHandle as string,
                  ) ?? false;

                if (!alreadyLinked) {
                  const newLinkedTwitter = currentLinkedTwitter
                    ? [...currentLinkedTwitter, token.twitterHandle as string]
                    : [token.twitterHandle as string];

                  await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { linkedTwitter: newLinkedTwitter },
                  });

                  console.log(
                    `[NextAuth] Successfully linked Twitter handle "${token.twitterHandle}" to user`,
                  );

                  console.log(
                    '[NextAuth] Logging out user after Twitter linking',
                  );
                  return {};
                }

                delete token.twitterHandle;
              } else {
                console.warn(
                  `[NextAuth] No user found with privyDid ${privyDid}`,
                );
              }
            }
          } catch (err) {
            console.error('[NextAuth] Failed to link Twitter handle:', err);
          }
        }

        return token;
      },

      async session({ session, token: _token }) {
        if (!session.user) return session;

        try {
          const privyDid = await getPrivyToken(req);
          if (!privyDid) return session;

          const user = await prisma.user.findUnique({
            where: { privyDid },
            select: {
              id: true,
              linkedTwitter: true,
            },
          });

          if (user) {
            (session.user as any).linkedTwitter = user.linkedTwitter || [];
            (session.user as any).id = user.id;
          }
        } catch (err) {
          console.error(
            '[NextAuth] Failed to fetch user data for session:',
            err,
          );
        }

        return session;
      },
    },
  };

  return await NextAuth(req, res, authOptions);
}

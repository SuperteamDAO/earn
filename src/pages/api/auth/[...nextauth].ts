import type { NextApiRequest, NextApiResponse } from 'next';
import NextAuth, { type NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

import { prisma } from '@/prisma';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { normalizeTwitterHandle } from '@/features/social/utils/twitter-verification';

/**
 * NextAuth configuration extended to:
 * 1. Extract Twitter handle in signIn and store in JWT token
 * 2. Link Twitter handle to user when Privy credentials are available (jwt callback)
 * 3. Expose `linkedTwitter` on the client session object so the UI updates immediately
 */
export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  const authOptions: NextAuthOptions = {
    providers: [
      TwitterProvider({
        clientId: process.env.TWITTER_CLIENT_ID!,
        clientSecret: process.env.TWITTER_CLIENT_SECRET!,
        version: '2.0',
      }),
    ],

    callbacks: {
      async signIn({ user, account, profile }) {
        console.log('🚀 [NextAuth] signIn callback triggered');
        console.log(
          '📝 [NextAuth] User object:',
          JSON.stringify(user, null, 2),
        );
        console.log(
          '🔐 [NextAuth] Account object:',
          JSON.stringify(account, null, 2),
        );
        console.log(
          '👤 [NextAuth] Profile object:',
          JSON.stringify(profile, null, 2),
        );

        if (account?.provider === 'twitter') {
          console.log('🐦 [NextAuth] Twitter provider detected');

          if (!profile) {
            console.warn('⚠️ [NextAuth] No profile found from Twitter');
            return true;
          }

          // Extract Twitter handle from profile and store for later processing
          const rawHandle =
            (profile as any)?.username ||
            (profile as any)?.data?.username ||
            (profile as any)?.screen_name ||
            '';

          console.log('🔍 [NextAuth] Raw handle extracted:', rawHandle);
          console.log(
            '🔍 [NextAuth] Available profile fields:',
            Object.keys(profile),
          );

          if (rawHandle) {
            const handle = normalizeTwitterHandle(rawHandle);
            console.log('✨ [NextAuth] Normalized handle:', handle);
            console.log(
              '💾 [NextAuth] Storing Twitter handle in token for later processing',
            );

            // Store the handle in the user object so it gets passed to the jwt callback
            (user as any).twitterHandle = handle;
          } else {
            console.warn('⚠️ [NextAuth] No Twitter username found in profile');
            console.log(
              '🔍 [NextAuth] Profile debug - checking for username fields:',
            );
            console.log('  - profile.username:', (profile as any)?.username);
            console.log(
              '  - profile.data?.username:',
              (profile as any)?.data?.username,
            );
            console.log(
              '  - profile.screen_name:',
              (profile as any)?.screen_name,
            );
            console.log('  - profile.login:', (profile as any)?.login);
            console.log('  - profile.handle:', (profile as any)?.handle);
          }
        } else {
          console.log('ℹ️ [NextAuth] Non-Twitter provider:', account?.provider);
        }

        console.log('✅ [NextAuth] signIn callback completed, returning true');
        return true;
      },

      /**
       * Handle the actual Twitter handle linking when we have access to Privy credentials
       */
      async jwt({ token, user }) {
        console.log('🎟️ [NextAuth] jwt callback triggered');

        // If we have a Twitter handle from the signIn callback, process it
        if ((user as any)?.twitterHandle) {
          console.log(
            '🔗 [NextAuth] Found Twitter handle to link:',
            (user as any).twitterHandle,
          );
          token.twitterHandle = (user as any).twitterHandle;
        }

        // If we have a pending Twitter handle, try to link it
        if (token.twitterHandle) {
          console.log(
            '🔍 [NextAuth] Attempting to link Twitter handle:',
            token.twitterHandle,
          );

          try {
            const privyDid = await getPrivyToken(req);

            if (privyDid) {
              console.log(
                '✅ [NextAuth] Privy DID found in jwt callback:',
                privyDid,
              );

              const existingUser = await prisma.user.findUnique({
                where: { privyDid },
                select: { id: true, linkedTwitter: true },
              });

              console.log('📊 [NextAuth] User lookup result:', existingUser);

              if (existingUser) {
                const currentLinkedTwitter = existingUser.linkedTwitter as
                  | string[]
                  | null;
                const alreadyLinked =
                  currentLinkedTwitter?.includes(
                    token.twitterHandle as string,
                  ) ?? false;

                console.log(
                  '🔍 [NextAuth] Already linked check:',
                  alreadyLinked,
                );

                if (!alreadyLinked) {
                  console.log(
                    '➕ [NextAuth] Adding Twitter handle to linkedTwitter array',
                  );

                  // Handle the case where linkedTwitter is null vs already has values
                  const newLinkedTwitter = currentLinkedTwitter
                    ? [...currentLinkedTwitter, token.twitterHandle as string]
                    : [token.twitterHandle as string];

                  console.log(
                    '📝 [NextAuth] New linkedTwitter array:',
                    newLinkedTwitter,
                  );

                  await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                      linkedTwitter: newLinkedTwitter,
                    },
                  });

                  console.log(
                    `✅ [NextAuth] Successfully linked Twitter handle "${token.twitterHandle}" to user ${privyDid}`,
                  );

                  // Verify the update
                  const updatedUser = await prisma.user.findUnique({
                    where: { id: existingUser.id },
                    select: { linkedTwitter: true },
                  });
                  console.log(
                    '🔄 [NextAuth] Updated linkedTwitter:',
                    updatedUser?.linkedTwitter,
                  );
                } else {
                  console.log(
                    `ℹ️ [NextAuth] Twitter handle "${token.twitterHandle}" already linked to user ${privyDid}`,
                  );
                }

                // Clear the flag since we've processed it
                console.log(
                  '🧹 [NextAuth] Clearing twitterHandle flag from token',
                );
                delete token.twitterHandle;
              } else {
                console.warn(
                  `❌ [NextAuth] No user found with privyDid ${privyDid} to link Twitter handle`,
                );
              }
            } else {
              console.warn(
                '⚠️ [NextAuth] No Privy DID found in jwt callback, will retry later',
              );
            }
          } catch (err) {
            console.error(
              '💥 [NextAuth] Failed to persist linkedTwitter during jwt:',
              err,
            );
            console.error('💥 [NextAuth] Error details:', {
              message: (err as Error).message,
              stack: (err as Error).stack,
              name: (err as Error).name,
            });
          }
        }

        console.log('✅ [NextAuth] jwt callback completed');
        return token;
      },

      /**
       * Attach `linkedTwitter` array to the session so the client can access it
       */
      async session({ session, token: _token }) {
        console.log('🎫 [NextAuth] session callback triggered');
        console.log(
          '📝 [NextAuth] Incoming session:',
          JSON.stringify(session, null, 2),
        );

        if (!session.user) {
          console.warn(
            '⚠️ [NextAuth] No user in session, returning session as-is',
          );
          return session;
        }

        try {
          console.log('🔍 [NextAuth] Getting Privy token for session...');
          const privyDid = await getPrivyToken(req);

          if (!privyDid) {
            console.warn('⚠️ [NextAuth] No Privy DID found for session');
            return session;
          }

          console.log(
            '🔍 [NextAuth] Fetching user data for privyDid:',
            privyDid,
          );

          const user = await prisma.user.findUnique({
            where: { privyDid },
            select: {
              id: true,
              linkedTwitter: true,
              email: true,
              username: true,
            },
          });

          console.log('📊 [NextAuth] User data from database:', user);

          if (user) {
            console.log('✅ [NextAuth] User found, attaching data to session');

            // Attach linkedTwitter to the session for client access
            (session.user as any).linkedTwitter = user.linkedTwitter || [];
            (session.user as any).id = user.id;

            console.log(
              '🔗 [NextAuth] Final session.user.linkedTwitter:',
              (session.user as any).linkedTwitter,
            );
            console.log(
              '🆔 [NextAuth] Final session.user.id:',
              (session.user as any).id,
            );
          } else {
            console.warn(
              '❌ [NextAuth] No user found in database for privyDid:',
              privyDid,
            );
          }
        } catch (err) {
          console.error(
            '💥 [NextAuth] Failed to fetch user data for session:',
            err,
          );
          console.error('💥 [NextAuth] Error details:', {
            message: (err as Error).message,
            stack: (err as Error).stack,
            name: (err as Error).name,
          });
        }

        console.log(
          '📤 [NextAuth] Final session object:',
          JSON.stringify(session, null, 2),
        );
        console.log('✅ [NextAuth] session callback completed');
        return session;
      },
    },
  };

  return await NextAuth(req, res, authOptions);
}

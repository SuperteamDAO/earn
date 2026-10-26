import * as Redacted from 'effect/Redacted';
import { exportSPKI, generateKeyPair, SignJWT, type CryptoKey } from 'jose';

import * as AppConfig from '@/server/app-config';

const privyKeys = await generateKeyPair('ES256', { extractable: true });

// Every integration off; tests turn on what they exercise.
export const testConfig = AppConfig.AppConfig.of({
  isProduction: false,
  earnProduction: false,
  isEarnBase: false,
  databaseUrl: Redacted.make('mysql://test@localhost/test'),
  siteUrl: 'http://localhost:3000',
  siteOrigins: ['http://localhost:3000'],
  privy: {
    appId: 'test-app',
    clientId: undefined,
    cookieDomain: undefined,
    verificationKey: await exportSPKI(privyKeys.publicKey),
    appSecret: undefined,
  },
  sessionSecret: Redacted.make('test-session-secret-0123456789abcdef'),
  openRouterApiKey: undefined,
  jupiterApiKey: undefined,
  solana: {
    rpcHost: undefined,
    paymentCluster: undefined,
    feePayerKey: undefined,
  },
  emailQueueUrl: undefined,
  agentQueueUrl: undefined,
  upstash: undefined,
  airtable: undefined,
  sumsub: undefined,
  cloudinary: undefined,
  x: undefined,
  xBearerToken: undefined,
  sheets: undefined,
  resend: undefined,
  unsubscribeSecret: undefined,
  zeroBounceApiKey: undefined,
  earncognito: undefined,
});

export const signToken = (
  claims: { sub: string; sid?: string; linked_accounts?: string },
  {
    audience = testConfig.privy.appId,
    key = privyKeys.privateKey,
    // In seconds; now if unset. Privy's tokens last an hour from it.
    issuedAt,
  }: { audience?: string; key?: CryptoKey; issuedAt?: number } = {},
) =>
  new SignJWT(claims)
    .setProtectedHeader({ alg: 'ES256' })
    .setIssuer('privy.io')
    .setAudience(audience)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt === undefined ? '1h' : issuedAt + 3600)
    .sign(key);

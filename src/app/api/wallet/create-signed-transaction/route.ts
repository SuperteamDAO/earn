import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as Wallet from '@/server/wallet';

import { withdrawalProblem } from '@/features/wallet/utils/withdrawal';

const Body = Schema.Struct({
  tokenAddress: Schema.String,
  amount: Schema.String,
  recipientAddress: Schema.String,
});

const serviceError = () =>
  json(500, {
    code: 'WITHDRAWAL_SERVICE_ERROR',
    error: 'Unable to prepare the withdrawal right now.',
  });

const REFUSALS = {
  AMOUNT_TOO_SMALL:
    'The withdrawal amount is too small. Increase the amount and try again.',
  AMOUNT_BELOW_ACCOUNT_SETUP_FEE:
    'The withdrawal amount must be greater than the recipient token account setup fee.',
  UNSUPPORTED_TOKEN:
    'This token is not supported for withdrawal. Please choose another token.',
} as const;

// Builds a withdrawal from the signed-in account's wallet, signed by Earn's
// fee payer, for the wallet page to sign with Privy and send.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) {
        // Earn's codes, which the wallet page turns into its messages.
        if (writer.status === 401) {
          return json(401, {
            code: 'AUTHENTICATION_REQUIRED',
            error: 'Your session has expired. Please sign in and try again.',
          });
        }
        if (writer.status === 403) {
          return json(403, {
            code: 'WITHDRAWAL_NOT_ALLOWED',
            error:
              'Withdrawals are not available for this account. Please contact support@superteam.fun.',
          });
        }
        return serviceError();
      }
      const body = yield* decodeBody(request, Body, 4096);
      if (body instanceof NextResponse) {
        return json(400, {
          code: 'INVALID_WITHDRAWAL_DETAILS',
          error: 'Invalid withdrawal details.',
        });
      }
      const problem = withdrawalProblem(body);
      if (problem) {
        return json(400, {
          code: 'INVALID_WITHDRAWAL_DETAILS',
          error: problem,
        });
      }
      return yield* Wallet.Wallet.use((wallet) =>
        wallet.withdrawal(writer.userId, body),
      ).pipe(
        Effect.map((withdrawal) => json(200, withdrawal)),
        Effect.catchTag('WithdrawalRefused', (error) =>
          Effect.logWarning('Withdrawal request rejected').pipe(
            Effect.annotateLogs({ userId: writer.userId, code: error.code }),
            Effect.as(
              json(400, { code: error.code, error: REFUSALS[error.code] }),
            ),
          ),
        ),
        Effect.catch((error) =>
          Effect.logError('Failed to create transfer transaction').pipe(
            Effect.annotateLogs({
              userId: writer.userId,
              error: error.message,
            }),
            Effect.as(serviceError()),
          ),
        ),
      );
    }),
  );
}

import 'server-only';

import * as Effect from 'effect/Effect';
import type { NextResponse } from 'next/server';

import { json } from '@/lib/route-guard';
import type * as GrantApplications from '@/server/grant-applications';
import type * as GrantReview from '@/server/grant-review';
import * as GrantTranches from '@/server/grant-tranches';

// How the grants area's route handlers answer typed failures. A refusal
// carries the status and body Earn's route answered, so the dashboard reads
// what it always did.
export const reviewResponse = <A, R>(
  effect: Effect.Effect<
    A,
    GrantReview.ReviewRefused | { readonly _tag: 'DatabaseError' },
    R
  >,
  respond: (value: A) => NextResponse = (value) => json(200, value),
) =>
  effect.pipe(
    Effect.map(respond),
    Effect.catchTags({
      ReviewRefused: (error) => Effect.succeed(json(error.status, error.body)),
      DatabaseError: () =>
        Effect.succeed(
          json(500, {
            error: 'Internal Server Error',
            message: 'Error occurred while processing the request.',
          }),
        ),
    }),
  );

const WALLET_CONFLICT_CODE = 'WALLET_ADDRESS_CONFLICT';

const walletConflict = () =>
  json(409, {
    code: WALLET_CONFLICT_CODE,
    error: GrantTranches.WALLET_CONFLICT,
    message: GrantTranches.WALLET_CONFLICT,
  });

// Earn's answers to an application (create or update).
export const applicationRefusal = <R>(
  effect: Effect.Effect<
    void,
    GrantApplications.ApplicationRefused | { readonly _tag: 'DatabaseError' },
    R
  >,
  failure: string,
) =>
  effect.pipe(
    Effect.as(json(200, { success: true })),
    Effect.catchTags({
      ApplicationRefused: ({ reason }) =>
        Effect.succeed(
          reason === 'member'
            ? json(403, {
                error: 'This grant is only available to Superteam members',
              })
            : reason === 'exists'
              ? json(400, { error: 'Grant Application already exists' })
              : reason === 'cooldown'
                ? json(429, {
                    error:
                      'You must wait 30 days before reapplying for this grant.',
                  })
                : reason === 'wallet'
                  ? walletConflict()
                  : json(reason === 'invalid' ? 400 : 403, {
                      error: 'Internal Server Error',
                      message: failure,
                    }),
        ),
      DatabaseError: () =>
        Effect.succeed(
          json(403, { error: 'Internal Server Error', message: failure }),
        ),
    }),
  );

const TRANCHE_FAILED = {
  error: 'Internal Server Error',
  message: 'Error occurred while creating tranche.',
};

// Earn's answers to a tranche request.
export const trancheResponse = <R>(
  effect: Effect.Effect<
    void,
    | GrantTranches.TrancheRefused
    | { readonly _tag: 'LockBusy' }
    | { readonly _tag: 'DatabaseError' },
    R
  >,
  applicationId: string,
) =>
  effect.pipe(
    Effect.as(json(200, { message: 'Tranche requested successfully' })),
    Effect.catchTags({
      LockBusy: () =>
        Effect.succeed(
          json(409, {
            error: 'Tranche creation already in progress',
            message: `Tranche creation is already being processed for application with id=${applicationId}.`,
          }),
        ),
      TrancheRefused: ({ reason }) =>
        Effect.succeed(
          reason === 'wallet'
            ? walletConflict()
            : reason === 'unauthorized'
              ? json(403, {
                  error: TRANCHE_UNAUTHORIZED,
                  message: TRANCHE_UNAUTHORIZED,
                })
              : json(500, TRANCHE_FAILED),
        ),
      DatabaseError: () => Effect.succeed(json(500, TRANCHE_FAILED)),
    }),
  );

const TRANCHE_UNAUTHORIZED =
  'Not authorized to request a tranche for this application';

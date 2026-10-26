import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import * as Database from '@/server/database';
import * as GrantAirtable from '@/server/grant-airtable';

import { sanitizeGrantApplicationHtml } from '@/features/grants/utils/sanitizeGrantApplicationHtml';
import { isAgenticEngineeringGrant } from '@/features/grants/utils/stGrant';

export const WALLET_CONFLICT =
  'This wallet address is linked to another applicant. Please use another wallet address.';

// Why Earn's createTranche refused.
export class TrancheRefused extends Schema.TaggedError<TrancheRefused>()(
  'TrancheRefused',
  {
    reason: Schema.Literals([
      // Not their application.
      'unauthorized',
      // Another grantee's wallet.
      'wallet',
      // Anything else Earn throws on: no KYC, every tranche asked for, the
      // previous one unpaid, proofs missing, nothing left to pay.
      'invalid',
    ]),
    // Earn's own words for it, for the logs.
    detail: Schema.String,
  },
) {
  override get message() {
    return `Tranche refused: ${this.reason}`;
  }
}

export interface TrancheRequest {
  readonly applicationId: string;
  // The applicant asking; unset when Earn creates the first tranche itself.
  readonly requesterUserId?: string;
  readonly helpWanted?: unknown;
  readonly update?: unknown;
  readonly walletAddress?: string;
  readonly isFirstTranche?: boolean;
  readonly eventPictures?: unknown;
  readonly eventReceipts?: unknown;
  readonly attendeeCount?: unknown;
  readonly socialPost?: unknown;
  readonly colosseumLink?: unknown;
  readonly githubRepo?: unknown;
  readonly aiReceipts?: unknown;
}

// Earn's grant tranches: created when the applicant asks, or (the first)
// when their KYC and approval are both in. The first is approved on the
// spot and filed with the foundation's Airtable for payment.
export class GrantTranches extends Context.Service<
  GrantTranches,
  {
    // null when a first tranche already exists (Earn skips it).
    readonly create: (
      request: TrancheRequest,
    ) => Effect.Effect<
      { readonly id: string } | null,
      TrancheRefused | Database.DatabaseError
    >;
  }
>()('earn/GrantTranches') {}

type Client = Pick<
  Database.Transaction,
  'grantApplication' | 'grantTranche' | 'user'
>;

// Earn's validateWalletAddressOwnership: a foundation grant's wallet belongs
// to one applicant.
export async function walletTaken(
  client: Pick<Client, 'grantApplication' | 'grantTranche'>,
  grant: { readonly isNative: boolean; readonly airtableId: string | null },
  userId: string,
  walletAddress: string,
): Promise<boolean> {
  if (!grant.isNative || !grant.airtableId) return false;
  const foundation = { isNative: true, airtableId: { not: null } };
  const [application, tranche] = await Promise.all([
    client.grantApplication.findFirst({
      where: { walletAddress, userId: { not: userId }, grant: foundation },
      select: { id: true },
    }),
    client.grantTranche.findFirst({
      where: {
        walletAddress,
        GrantApplication: { userId: { not: userId }, grant: foundation },
      },
      select: { id: true },
    }),
  ]);
  return !!application || !!tranche;
}

const CLOUDINARY_HOST = 'res.cloudinary.com';
const MAX_EVENT_PICTURES = 5;
const MAX_EVENT_RECEIPTS = 10;
const MAX_AGENTIC_RECEIPTS = 3;

class Invalid extends Error {}

const parseHttpUrl = (value: string): URL | null => {
  const parsed = URL.parse(value);
  return parsed && (parsed.protocol === 'http:' || parsed.protocol === 'https:')
    ? parsed
    : null;
};

const isCloudinaryUrl = (value: string) => {
  const host = parseHttpUrl(value)?.hostname.toLowerCase();
  return (
    host !== undefined &&
    (host === CLOUDINARY_HOST || host.endsWith(`.${CLOUDINARY_HOST}`))
  );
};

const isEmpty = (value: unknown) =>
  value === undefined || value === null || value === '';

function imageUrls(
  value: unknown,
  label: string,
  required: boolean,
  max: number,
  requiredMessage: string,
): string[] | undefined {
  if (value === undefined || value === null) {
    if (required) throw new Invalid(requiredMessage);
    return undefined;
  }
  if (!Array.isArray(value)) throw new Invalid(`${label} must be a list.`);
  if (value.length === 0) {
    if (required) throw new Invalid(requiredMessage);
    return undefined;
  }
  if (value.length > max) throw new Invalid(`${label}: at most ${max}.`);
  return value.map((entry: unknown) => {
    if (typeof entry !== 'string') throw new Invalid(`${label}: not a URL.`);
    const trimmed = entry.trim();
    if (!isCloudinaryUrl(trimmed)) {
      throw new Invalid(`${label} must be Cloudinary URLs.`);
    }
    return trimmed;
  });
}

function genericUrl(value: unknown, label: string, required: boolean) {
  if (isEmpty(value)) {
    if (required) throw new Invalid(`${label} is required.`);
    return undefined;
  }
  if (typeof value !== 'string') throw new Invalid(`${label}: not a URL.`);
  const trimmed = value.trim();
  const parsed = parseHttpUrl(
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`,
  );
  if (!parsed || !parsed.hostname.includes('.')) {
    throw new Invalid(`${label} must be a valid URL.`);
  }
  return parsed.toString();
}

function githubRepoUrl(value: unknown, required: boolean) {
  if (isEmpty(value)) {
    if (required) throw new Invalid('GitHub repo is required.');
    return undefined;
  }
  if (typeof value !== 'string') throw new Invalid('GitHub repo: not a URL.');
  const trimmed = value.trim();
  const parsed = parseHttpUrl(
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed.replace(/^\/+/, '')}`,
  );
  if (!parsed) throw new Invalid('GitHub repo must be a valid URL.');
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (host !== 'github.com' || segments.length < 2) {
    throw new Invalid('GitHub repo must be a valid github.com URL.');
  }
  return new URL(
    `${segments.join('/')}${parsed.search}${parsed.hash}`,
    'https://github.com/',
  ).toString();
}

function attendees(value: unknown, required: boolean) {
  if (isEmpty(value)) {
    if (required) throw new Invalid('Attendee count is required.');
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    throw new Invalid('Attendee count must be a positive whole number.');
  }
  return parsed;
}

// What a tranche pays, as Earn works it out: half then the rest for two
// tranches; 30%, 30%, then the rest for three or four.
export function trancheAmount({
  totalTranches,
  approvedAmount,
  remaining,
  existing,
  first,
}: {
  readonly totalTranches: number;
  readonly approvedAmount: number;
  readonly remaining: number;
  readonly existing: number;
  readonly first: boolean;
}): number {
  if (totalTranches === 2) {
    if (first) return Math.round(remaining * 0.5);
    if (existing === 1) return remaining;
  }
  if (totalTranches === 3) {
    if (first || existing === 1) return Math.round(approvedAmount * 0.3);
    if (existing === 2) return remaining;
  }
  if (totalTranches === 4) {
    if (first || existing === 1) return Math.round(approvedAmount * 0.3);
    if (existing === 2 || existing === 3) return remaining;
  }
  return 0;
}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const airtable = yield* GrantAirtable.GrantAirtable;

  const create = Effect.fn('GrantTranches.create')(function* (
    request: TrancheRequest,
  ) {
    const { applicationId, isFirstTranche: first = false } = request;
    const outcome = yield* database.query('createTranche', async (client) => {
      const application = await client.grantApplication.findUniqueOrThrow({
        where: { id: applicationId },
        select: {
          id: true,
          userId: true,
          grantId: true,
          approvedAmount: true,
          totalPaid: true,
          totalTranches: true,
          user: { select: { isKYCVerified: true } },
          grant: {
            select: {
              title: true,
              isST: true,
              isNative: true,
              airtableId: true,
            },
          },
          GrantTranche: {
            orderBy: { createdAt: 'asc' },
            select: { id: true, status: true },
          },
        },
      });
      if (
        request.requesterUserId &&
        application.userId !== request.requesterUserId
      ) {
        return {
          kind: 'refused',
          refused: 'unauthorized',
          detail: 'not theirs',
        } as const;
      }
      try {
        if (!application.user.isKYCVerified) {
          throw new Invalid('User is not verified');
        }
        const isST = application.grant.isST;
        const agentic = isAgenticEngineeringGrant(application.grant);
        const valid = application.GrantTranche.filter(
          (tranche) => tranche.status !== 'Rejected',
        );
        const existing = valid.length;
        const eventProof = isST && !first;
        const agenticProof = agentic && !first && existing === 1;
        if (existing >= 4) throw new Invalid('All tranches already created');
        if (first && existing > 0) return { kind: 'skipped' } as const;
        if (!first && existing === 0) {
          throw new Invalid('No first tranche yet');
        }
        const previous = valid[existing - 1];
        if (previous && previous.status !== 'Paid') {
          throw new Invalid('Previous tranche not paid');
        }

        const eventPictures = imageUrls(
          request.eventPictures,
          'Event pictures',
          eventProof,
          MAX_EVENT_PICTURES,
          'At least one event picture is required.',
        );
        const eventReceipts = imageUrls(
          request.eventReceipts,
          'Event receipts',
          eventProof,
          MAX_EVENT_RECEIPTS,
          'At least one event receipt is required.',
        );
        const attendeeCount = attendees(request.attendeeCount, eventProof);
        const socialPost = genericUrl(
          request.socialPost,
          'Social post link',
          eventProof,
        );
        const colosseumLink = genericUrl(
          request.colosseumLink,
          'Project URL',
          agenticProof,
        );
        const githubRepo = githubRepoUrl(request.githubRepo, agenticProof);
        const aiReceipts = imageUrls(
          request.aiReceipts,
          'AI subscription receipts',
          agenticProof,
          MAX_AGENTIC_RECEIPTS,
          'AI subscription receipt is required.',
        );

        const wallet = request.walletAddress;
        if (
          wallet &&
          (await walletTaken(
            client,
            application.grant,
            application.userId,
            wallet,
          ))
        ) {
          return {
            kind: 'refused',
            refused: 'wallet',
            detail: WALLET_CONFLICT,
          } as const;
        }

        const remaining = application.approvedAmount - application.totalPaid;
        const ask = trancheAmount({
          totalTranches: application.totalTranches,
          approvedAmount: application.approvedAmount,
          remaining,
          existing,
          first,
        });
        if (ask > remaining) throw new Invalid('Amount exceeds remaining');
        if (!Number.isFinite(ask) || ask <= 0) {
          throw new Invalid('Invalid tranche amount');
        }

        const tranche = await client.grantTranche.create({
          data: {
            applicationId,
            ask,
            status: first ? 'Approved' : 'Pending',
            helpWanted: sanitizeGrantApplicationHtml(
              typeof request.helpWanted === 'string' ? request.helpWanted : '',
            ),
            update: sanitizeGrantApplicationHtml(
              typeof request.update === 'string' ? request.update : '',
            ),
            walletAddress: wallet,
            grantId: application.grantId,
            trancheNumber: existing + 1,
            ...(first && { approvedAmount: ask, decidedAt: new Date() }),
            ...(eventPictures && { eventPictures }),
            ...(eventReceipts && { eventReceipts }),
            ...(attendeeCount !== undefined && { attendeeCount }),
            ...(socialPost && { socialPost }),
            ...(colosseumLink && { colosseumLink }),
            ...(githubRepo && { githubRepo }),
            ...(aiReceipts && { aiReceipts }),
          },
          select: { id: true, status: true, approvedAmount: true },
        });
        if (wallet) {
          await client.grantApplication.update({
            where: { id: applicationId },
            data: { walletAddress: wallet },
          });
        }
        return { kind: 'created', tranche } as const;
      } catch (error) {
        if (error instanceof Invalid) {
          return {
            kind: 'refused',
            refused: 'invalid',
            detail: error.message,
          } as const;
        }
        throw error;
      }
    });

    if (outcome.kind === 'refused') {
      return yield* new TrancheRefused({
        reason: outcome.refused,
        detail: outcome.detail,
      });
    }
    if (outcome.kind === 'skipped') {
      yield* Effect.logInfo('First tranche exists; skipped').pipe(
        Effect.annotateLogs({ applicationId }),
      );
      return null;
    }

    if (first) {
      // The foundation pays from Airtable: the recipient, then the payment.
      const [onboarding, payment] = yield* database.query(
        'trancheAirtableRows',
        (client) =>
          Promise.all([
            client.grantApplication.findUniqueOrThrow({
              where: { id: applicationId },
              select: {
                id: true,
                approvedAmount: true,
                projectTimeline: true,
                createdAt: true,
                user: { select: { email: true, kycName: true } },
                grant: { select: { airtableId: true } },
              },
            }),
            client.grantApplication.findUniqueOrThrow({
              where: { id: applicationId },
              select: GrantAirtable.PAYMENT_APPLICATION,
            }),
          ]),
      );
      if (yield* airtable.addRecipient(onboarding)) {
        yield* airtable.addPayment(payment, outcome.tranche);
      }
    }
    return { id: outcome.tranche.id };
  });

  return GrantTranches.of({ create });
});

export const layer = Layer.effect(GrantTranches, make);

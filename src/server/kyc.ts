import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import { createHmac } from 'node:crypto';

import * as AppConfig from '@/server/app-config';

export class KycUnavailable extends Schema.TaggedError<KycUnavailable>()(
  'KycUnavailable',
  {},
) {
  override get message() {
    return 'Sumsub is not configured';
  }
}

export class KycError extends Schema.TaggedError<KycError>()('KycError', {
  operation: Schema.String,
  cause: Schema.Defect(),
}) {
  override get message() {
    return `Sumsub request failed: ${this.operation}`;
  }
}

export interface Applicant {
  readonly id: string;
  readonly fullName: string;
  // ISO 3166 alpha-3, as Sumsub gives it.
  readonly country: string;
  readonly dob: string;
  readonly idNumber: string;
  readonly idType: string;
}

export type Verification =
  | 'verified'
  | 'timedOut'
  | { readonly status: 'failed'; readonly reason: string };

// Sumsub, the KYC provider for grant and bounty payouts. People are keyed by
// their Earn user id, so one check counts for grants and bounty payouts alike.
export class Kyc extends Context.Service<
  Kyc,
  {
    // A ten-minute token for Sumsub's web SDK.
    readonly accessToken: (
      userId: string,
    ) => Effect.Effect<string, KycUnavailable | KycError>;
    // Their applicant and the document they were verified with.
    readonly applicant: (
      userId: string,
    ) => Effect.Effect<Applicant, KycUnavailable | KycError>;
    // Sumsub's verdict, polled for up to ten seconds as Earn does.
    readonly verification: (
      applicantId: string,
    ) => Effect.Effect<Verification, KycUnavailable | KycError>;
  }
>()('earn/Kyc') {}

const BASE = 'https://api.sumsub.com';
// What Earn records when the document has no number.
const NO_ID_NUMBER = 'REDACTED';

type Json = Record<string, unknown>;
const isRecord = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown) => (typeof value === 'string' ? value : '');
const toInt = (value: unknown): number | null => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN;
  return Number.isNaN(parsed) ? null : parsed;
};

// Image ids a document's record lists, in any of the shapes Sumsub uses.
function imageIdsOf(doc: unknown): Array<number> {
  if (!isRecord(doc)) return [];
  const ids = new Set<number>();
  for (const key of ['imageIds', 'images', 'pages', 'sides']) {
    const list = doc[key];
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const id = isRecord(item)
        ? (toInt(item.imageId) ?? toInt(item.id))
        : toInt(item);
      if (id !== null) ids.add(id);
    }
  }
  for (const key of ['imageId', 'id']) {
    const id = toInt(doc[key]);
    if (id !== null) ids.add(id);
  }
  return [...ids];
}

// The document Sumsub accepted: matched by its accepted images, then by the
// step's type or country, then the first, as Earn picks it.
export function acceptedDocument(info: Json, identity: unknown): Json | null {
  const docs = Array.isArray(info.idDocs) ? info.idDocs.filter(isRecord) : [];
  const accepted: Array<number> = [];
  if (isRecord(identity)) {
    if (Array.isArray(identity.imageStatuses)) {
      for (const status of identity.imageStatuses) {
        if (
          isRecord(status) &&
          isRecord(status.reviewResult) &&
          status.reviewResult.reviewAnswer === 'GREEN'
        ) {
          const id = toInt(status.imageId);
          if (id !== null) accepted.push(id);
        }
      }
    }
    if (accepted.length === 0 && isRecord(identity.imageReviewResults)) {
      for (const [id, result] of Object.entries(identity.imageReviewResults)) {
        if (isRecord(result) && result.reviewAnswer === 'GREEN') {
          const parsed = toInt(id);
          if (parsed !== null) accepted.push(parsed);
        }
      }
    }
  }
  let best: Json | null = null;
  let bestCount = 0;
  for (const doc of docs) {
    const count = imageIdsOf(doc).filter((id) => accepted.includes(id)).length;
    if (count > bestCount) {
      best = doc;
      bestCount = count;
    }
  }
  if (best) return best;
  if (isRecord(identity)) {
    const byType = docs.find(
      (doc) => doc.idDocType && doc.idDocType === identity.idDocType,
    );
    const byCountry = docs.find(
      (doc) => doc.country && doc.country === identity.country,
    );
    if (byType ?? byCountry) return byType ?? byCountry ?? null;
  }
  return docs[0] ?? null;
}

const titleCase = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const sumsub = config.sumsub;

  // Sumsub's signed request: HMAC-SHA256 of time, method, path and body.
  const call = (
    operation: string,
    method: 'GET' | 'POST',
    path: string,
    body = '',
  ): Effect.Effect<Json, KycUnavailable | KycError> =>
    sumsub
      ? Effect.tryPromise({
          try: async () => {
            const ts = Math.floor(Date.now() / 1000).toString();
            const signature = createHmac(
              'sha256',
              Redacted.value(sumsub.secretKey),
            )
              .update(ts + method + path + body)
              .digest('hex');
            const response = await fetch(`${BASE}${path}`, {
              method,
              headers: {
                'Content-Type': 'application/json',
                'X-App-Token': Redacted.value(sumsub.appToken),
                'X-App-Access-Sig': signature,
                'X-App-Access-Ts': ts,
              },
              ...(method === 'POST' ? { body } : {}),
              signal: AbortSignal.timeout(10_000),
            });
            if (!response.ok) throw new Error(`Sumsub ${response.status}`);
            const data: unknown = await response.json();
            if (!isRecord(data)) throw new Error('Unexpected Sumsub body');
            return data;
          },
          catch: (cause) => new KycError({ operation, cause }),
        })
      : Effect.fail(new KycUnavailable());

  const accessToken = (userId: string) =>
    call(
      'accessToken',
      'POST',
      '/resources/accessTokens/sdk',
      JSON.stringify({
        ttlInSecs: 600,
        userId,
        levelName: sumsub?.levelName,
      }),
    ).pipe(
      Effect.flatMap((data) =>
        typeof data.token === 'string'
          ? Effect.succeed(data.token)
          : Effect.fail(
              new KycError({ operation: 'accessToken', cause: 'no token' }),
            ),
      ),
    );

  const applicant = (userId: string) =>
    Effect.gen(function* () {
      const found = yield* call(
        'applicant',
        'GET',
        `/resources/applicants/-;externalUserId=${encodeURIComponent(userId)}/one`,
      );
      const id = text(found.id);
      if (!id) {
        return yield* new KycError({ operation: 'applicant', cause: 'no id' });
      }
      const info = isRecord(found.info) ? found.info : {};
      const docs = yield* call(
        'requiredIdDocsStatus',
        'GET',
        `/resources/applicants/${id}/requiredIdDocsStatus`,
      );
      const doc = acceptedDocument(info, docs.IDENTITY);
      if (!doc) {
        return yield* new KycError({
          operation: 'applicant',
          cause: 'no ID documents',
        });
      }
      const number = text(doc.number).trim();
      return {
        id,
        fullName: titleCase(
          `${text(info.firstNameEn)} ${text(info.middleNameEn)} ${text(info.lastNameEn)}`,
        ),
        country: text(info.country),
        dob: text(info.dob),
        idNumber: number ? text(doc.number) : NO_ID_NUMBER,
        idType: text(doc.idDocType),
      } satisfies Applicant;
    });

  const verification = (applicantId: string) =>
    Effect.gen(function* () {
      for (let attempt = 0; attempt < 10; attempt++) {
        const status = yield* call(
          'status',
          'GET',
          `/resources/applicants/${applicantId}/status`,
        ).pipe(Effect.option);
        const review =
          status._tag === 'Some' && isRecord(status.value.reviewResult)
            ? status.value.reviewResult
            : null;
        if (review?.reviewAnswer === 'GREEN') return 'verified' as const;
        if (review?.reviewAnswer === 'RED') {
          const labels = Array.isArray(review.rejectLabels)
            ? review.rejectLabels.filter(
                (label): label is string => typeof label === 'string',
              )
            : [];
          const type = text(review.reviewRejectType);
          const reason =
            text(review.clientComment).trim() ||
            text(review.moderationComment).trim() ||
            (labels.length > 0
              ? `Rejected due to: ${labels.join(', ')}`
              : type
                ? `Rejected (${type})`
                : 'Your verification was rejected. Please review your details and try again.');
          return { status: 'failed', reason } as const;
        }
        yield* Effect.sleep('1 second');
      }
      return 'timedOut' as const;
    });

  return Kyc.of({ accessToken, applicant, verification });
});

export const layer = Layer.effect(Kyc, make);

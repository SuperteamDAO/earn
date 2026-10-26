import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import { Resend } from 'resend';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import * as RateLimits from '@/server/rate-limits';

import { supportEmailTemplate } from '@/features/emails/components/supportEmailTemplate';
import { WelcomeSponsorTemplate } from '@/features/emails/components/welcomeSponsorTemplate';

export class InvalidSupportRequest extends Schema.TaggedError<InvalidSupportRequest>()(
  'InvalidSupportRequest',
  { reason: Schema.String },
) {
  override get message() {
    return this.reason;
  }
}

export class SendFailed extends Schema.TaggedError<SendFailed>()(
  'SendFailed',
  {},
) {
  override get message() {
    return 'Failed to send email';
  }
}

export class BlockedAddress extends Schema.TaggedError<BlockedAddress>()(
  'BlockedAddress',
  {},
) {
  override get message() {
    return 'Blocked Email';
  }
}

export class NoUser extends Schema.TaggedError<NoUser>()('NoUser', {}) {
  override get message() {
    return 'No such user';
  }
}

export interface SupportRequest {
  readonly email: string;
  readonly subject: string;
  readonly description: string;
}

// Earn's support form refuses these.
const BLOCKED_DOMAINS = new Set([
  'example.com',
  'example.net',
  'example.org',
  'invalid',
  'localhost',
  'test.com',
]);

// The address check Earn's form used (zod's).
const EMAIL =
  /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;

// A support request, trimmed and checked as Earn's form schema did.
export const validateSupportRequest = (
  request: SupportRequest,
): SupportRequest | string => {
  const email = request.email.trim().toLowerCase();
  const subject = request.subject.trim();
  const description = request.description.trim();
  if (!EMAIL.test(email)) return 'Invalid email';
  if (BLOCKED_DOMAINS.has(email.split('@').at(-1) ?? '')) {
    return 'Please use a valid email address';
  }
  if (subject.length < 1) return 'Subject is required';
  if (description.length < 10) {
    return 'Description must be at least 10 characters';
  }
  return { email, subject, description };
};

// Emails Earn sends itself, through Resend, rather than via earn-emails:
// the support form's request to the team, and a new sponsor's welcome.
export class ManualEmails extends Context.Service<
  ManualEmails,
  {
    // Sends a support request to support@superteam.fun, at most five an
    // hour per address and per sender. Resolves to Resend's message id.
    readonly support: (
      request: SupportRequest,
      ip: string,
    ) => Effect.Effect<
      string | undefined,
      InvalidSupportRequest | RateLimits.RateLimited | SendFailed
    >;
    // Welcomes a new sponsor at their account's address, unless it's
    // blocked. A send that fails is logged, never failed: the sponsor
    // exists by then.
    readonly welcomeSponsor: (
      userId: string,
    ) => Effect.Effect<void, NoUser | BlockedAddress | Database.DatabaseError>;
  }
>()('earn/ManualEmails') {}

const SENDER = 'Superteam <hello@superteam.fun>';
const SUPPORT_SENDER = 'Earn Support Form <support-form@superteamearn.com>';
const SUPPORT_INBOX = 'support@superteam.fun';

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const db = yield* Database.Database;
  const limits = yield* RateLimits.RateLimits;
  const resend = config.resend
    ? new Resend(Redacted.value(config.resend.apiKey))
    : null;

  const support = Effect.fn('ManualEmails.support')(function* (
    request: SupportRequest,
    ip: string,
  ) {
    yield* limits.check('supportEmail', `ip:${ip}`);
    const valid = validateSupportRequest(request);
    if (typeof valid === 'string') {
      return yield* new InvalidSupportRequest({ reason: valid });
    }
    yield* limits.check('supportEmail', `email:${valid.email}`);
    if (!resend) return yield* new SendFailed();
    const { data, error } = yield* Effect.tryPromise({
      try: () =>
        resend.emails.send({
          from: SUPPORT_SENDER,
          to: [SUPPORT_INBOX],
          replyTo: valid.email,
          subject: `Support Request: ${valid.subject}`,
          react: supportEmailTemplate({
            from: valid.email,
            subject: valid.subject,
            description: valid.description,
          }),
        }),
      catch: () => new SendFailed(),
    });
    if (error) {
      yield* Effect.logError('Support email failed').pipe(
        Effect.annotateLogs({ name: error.name }),
      );
      return yield* new SendFailed();
    }
    return data?.id;
  });

  const welcomeSponsor = Effect.fn('ManualEmails.welcomeSponsor')(function* (
    userId: string,
  ) {
    const user = yield* db.query('user.email', (client) =>
      client.user.findUnique({
        where: { id: userId },
        select: { email: true },
      }),
    );
    if (!user) return yield* new NoUser();
    const email = user.email.toLowerCase();
    const blocked = yield* db.query('blockedEmail.find', (client) =>
      client.blockedEmail.findUnique({ where: { email } }),
    );
    if (blocked) return yield* new BlockedAddress();
    if (!resend) {
      return yield* Effect.logWarning('Resend not configured; email skipped');
    }
    const sent = yield* Effect.tryPromise(() =>
      resend.emails.send({
        from: SENDER,
        to: [email],
        subject: 'Welcome!',
        react: WelcomeSponsorTemplate(),
        replyTo: config.resend?.replyTo,
      }),
    ).pipe(Effect.option);
    if (Option.isNone(sent) || sent.value.error) {
      return yield* Effect.logError('Welcome sponsor email failed');
    }
    return yield* Effect.void;
  });

  return ManualEmails.of({ support, welcomeSponsor });
});

export const layer = Layer.effect(ManualEmails, make);

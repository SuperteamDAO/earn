import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import { Resend } from 'resend';

import * as AppConfig from '@/server/app-config';

import { InviteMemberTemplate } from '@/features/emails/components/inviteMemberTemplate';

export class InviteMailFailed extends Schema.TaggedError<InviteMailFailed>()(
  'InviteMailFailed',
  {},
) {
  override get message() {
    return 'Sending the invite email failed';
  }
}

export interface InviteMail {
  readonly to: string;
  readonly senderFirstName: string | null;
  readonly senderName: string;
  readonly sponsorName: string;
  readonly link: string;
}

// The email inviting someone to a sponsor's team, sent through Resend
// straight away, as Earn's /api/member-invites/send did (not earn-emails).
// Without Resend configured, it's logged and skipped.
export class TeamInviteMail extends Context.Service<
  TeamInviteMail,
  { readonly send: (mail: InviteMail) => Effect.Effect<void, InviteMailFailed> }
>()('earn/TeamInviteMail') {}

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const resend = config.resend
    ? new Resend(Redacted.value(config.resend.apiKey))
    : null;
  const replyTo = config.resend?.replyTo;

  const send = Effect.fn('TeamInviteMail.send')(function* (mail: InviteMail) {
    if (!resend) {
      yield* Effect.logWarning('Resend not configured; invite skipped');
      return;
    }
    const result = yield* Effect.tryPromise({
      try: () =>
        resend.emails.send({
          from: 'Superteam <hello@superteam.fun>',
          to: [mail.to],
          subject: `${mail.senderFirstName} has invited you to join ${mail.sponsorName}'s profile on Superteam Earn`,
          react: InviteMemberTemplate({
            sponsorName: mail.sponsorName,
            senderName: mail.senderName,
            link: mail.link,
          }),
          replyTo,
        }),
      catch: () => new InviteMailFailed(),
    });
    // Earn never read Resend's refusal; it's logged, the invite stands.
    if (result.error) {
      yield* Effect.logWarning('Resend refused the invite email');
    }
  });

  return TeamInviteMail.of({ send });
});

export const layer = Layer.effect(TeamInviteMail, make);

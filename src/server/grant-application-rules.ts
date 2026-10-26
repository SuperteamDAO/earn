import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { URL_REGEX } from '@/constants/URL_REGEX';
import { dayjs } from '@/utils/dayjs';
import { validateSolAddress } from '@/utils/validateSolAddress';

import {
  AGENTIC_ENGINEERING_FIXED_ASK,
  extractLumaEventSlug,
  getGrantFixedAsk,
  isAgenticEngineeringGrant,
  LUMA_PREFIX,
} from '@/features/grants/utils/stGrant';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import { twitterRegex } from '@/features/social/utils/regex';
import {
  extractXHandle,
  isHandleVerified,
} from '@/features/social/utils/x-verification';

// Earn's grant application rules (grantApplicationSchema), as the server
// checks them: the form posts what its own resolver produced (profile links,
// a number for the ask), and the server reads the usernames back out of the
// links before checking, exactly as Earn's create and update routes do.

// What the form posts. Loose on purpose: anything missing or of the wrong
// type fails the rules below rather than the request.
export const ApplicationBody = Schema.Struct({
  grantId: Schema.String,
  projectTitle: Schema.optional(Schema.Unknown),
  projectOneLiner: Schema.optional(Schema.Unknown),
  projectDetails: Schema.optional(Schema.Unknown),
  projectTimeline: Schema.optional(Schema.Unknown),
  proofOfWork: Schema.optional(Schema.Unknown),
  milestones: Schema.optional(Schema.Unknown),
  kpi: Schema.optional(Schema.Unknown),
  walletAddress: Schema.optional(Schema.Unknown),
  ask: Schema.optional(Schema.Unknown),
  twitter: Schema.optional(Schema.Unknown),
  github: Schema.optional(Schema.Unknown),
  answers: Schema.optional(Schema.Unknown),
  telegram: Schema.optional(Schema.Unknown),
  lumaLink: Schema.optional(Schema.Unknown),
  expenseBreakdown: Schema.optional(Schema.Unknown),
});
export type ApplicationBody = typeof ApplicationBody.Type;

interface GrantQuestionRule {
  readonly question: string;
  readonly optional?: boolean;
  readonly type?: 'text' | 'link';
}

export interface ApplicationGrant {
  readonly title: string;
  readonly token: string | null;
  readonly minReward: number | null;
  readonly maxReward: number | null;
  readonly isST: boolean;
  readonly questions: ReadonlyArray<GrantQuestionRule>;
}

// The application as Earn stores it, before sanitizing.
export interface ValidApplication {
  readonly projectTitle: string;
  readonly projectOneLiner: string;
  readonly projectDetails: string;
  readonly projectTimeline: string | undefined;
  readonly proofOfWork: string | undefined;
  readonly milestones: string | undefined;
  readonly kpi: string | undefined;
  readonly walletAddress: string;
  readonly ask: number;
  readonly twitter: string;
  // A github.com link; null or undefined when left out (Earn's update and
  // create differ here, and the column keeps whichever it got).
  readonly github: string | null | undefined;
  readonly answers: ReadonlyArray<{ question: string; answer: string }>;
  // A t.me link.
  readonly telegram: string;
  readonly lumaLink: string | undefined;
  readonly expenseBreakdown: string | undefined;
}

const X_USERNAME_REGEX = /^[A-Za-z0-9_]{1,15}$/;

const isString = (value: unknown): value is string => typeof value === 'string';

// A field already checked to be text or absent.
const textOrUndefined = (value: unknown) =>
  isString(value) ? value : undefined;

// A required text field: a string at least one character long, and at most
// `max` when given.
const required = (value: unknown, max?: number): value is string =>
  isString(value) &&
  value.length >= 1 &&
  (max === undefined || value.length <= max);

// Optional text: absent, or a string.
const optionalText = (value: unknown): value is string | undefined =>
  value === undefined || isString(value);

const startsLikeUrl = (value: string) =>
  value.startsWith('https://') || value.startsWith('http://');

// telegramUsernameSchema: 5 to 32 letters, digits or '_', starting with a
// letter. Becomes a t.me link.
const TelegramUsername = Schema.String.check(
  Schema.makeFilter(
    (value) =>
      value.length >= 5 &&
      value.length <= 32 &&
      /^[a-zA-Z]/.test(value) &&
      !startsLikeUrl(value) &&
      /^[a-zA-Z0-9_]*$/.test(value),
  ),
);

// githubUsernameSchema: 1 to 39 letters, digits or '-'.
const GithubUsername = Schema.String.check(
  Schema.makeFilter(
    (value) =>
      value.length >= 1 &&
      value.length <= 39 &&
      !startsLikeUrl(value) &&
      /^[a-zA-Z0-9-]*$/.test(value),
  ),
);

const Answers = Schema.Array(
  Schema.Struct({ question: Schema.String, answer: Schema.String }),
);

const normalizeLinkAnswer = (answer: string) => {
  const trimmed = answer.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

// The ask as Earn's schema reads it: empty takes the fixed ask, USDG asks
// are rounded to whole numbers.
function askOf(value: unknown, token: string, fixedAsk: number | undefined) {
  if (value === '' || value === null || value === undefined) {
    return fixedAsk ?? value;
  }
  if (token !== 'USDG') return value;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : value;
}

// Earn's checks, in Earn's order. None when the application fails any of
// them; Earn answers those with a bare 400, so which one failed doesn't
// matter to the caller.
export function validateApplication(
  body: ApplicationBody,
  grant: ApplicationGrant,
  linkedTwitter: ReadonlyArray<string>,
  { editing }: { editing: boolean },
): Option.Option<ValidApplication> {
  const isST = grant.isST;
  const isAgentic = isAgenticEngineeringGrant(grant);
  const token = grant.token ?? '';
  const minReward = grant.minReward ?? 0;
  const maxReward = grant.maxReward ?? 0;
  const schemaFixedAsk = isAgentic
    ? minReward === maxReward && minReward > 0
      ? minReward
      : AGENTIC_ENGINEERING_FIXED_ASK
    : undefined;

  // The routes read usernames back out of the links the form sent.
  // (Anything but text matches no link: the checks below then fail it.)
  const linkUsername = (
    platform: 'twitter' | 'github',
    value: unknown,
  ): string =>
    (isString(value) && extractSocialUsername(platform, value)) || '';
  const twitterInput =
    body.twitter !== undefined
      ? linkUsername('twitter', body.twitter)
      : undefined;
  const githubInput = editing
    ? body.github
      ? linkUsername('github', body.github)
      : null
    : body.github !== undefined
      ? linkUsername('github', body.github)
      : undefined;
  const telegramInput = isString(body.telegram)
    ? extractSocialUsername('telegram', body.telegram)
    : null;

  if (!required(body.projectTitle, 100)) return Option.none();
  if (!required(body.projectOneLiner, 150)) return Option.none();

  const ask = askOf(body.ask, token, schemaFixedAsk);
  if (typeof ask !== 'number' || Number.isNaN(ask)) return Option.none();
  if (ask < Math.max(1, minReward) || ask > maxReward) return Option.none();

  if (!required(body.projectDetails)) return Option.none();
  if (!required(body.walletAddress)) return Option.none();
  const timelineOk = isST
    ? optionalText(body.projectTimeline)
    : required(body.projectTimeline);
  if (!timelineOk) return Option.none();
  const proofOk = isST
    ? optionalText(body.proofOfWork)
    : required(body.proofOfWork);
  if (!proofOk) return Option.none();
  const milestonesOk = isAgentic
    ? optionalText(body.milestones)
    : required(body.milestones);
  if (!milestonesOk) return Option.none();
  const kpiOk = isST || isAgentic ? optionalText(body.kpi) : required(body.kpi);
  if (!kpiOk) return Option.none();

  // twitterProfileSchema: a handle or an X profile link, kept as a link.
  if (!isString(twitterInput)) return Option.none();
  const twitterTrimmed = twitterInput.trim();
  if (
    !twitterTrimmed ||
    !(
      X_USERNAME_REGEX.test(twitterTrimmed) || twitterRegex.test(twitterTrimmed)
    )
  ) {
    return Option.none();
  }
  const twitter = X_USERNAME_REGEX.test(twitterTrimmed)
    ? `https://x.com/${twitterTrimmed}`
    : (() => {
        const handle = extractXHandle(twitterTrimmed);
        return handle ? `https://x.com/${handle}` : twitterTrimmed;
      })();

  let github: string | null | undefined;
  if (githubInput === '' || githubInput === undefined) github = undefined;
  else if (githubInput === null) github = null;
  else {
    const parsed = Schema.decodeOption(GithubUsername)(githubInput);
    if (Option.isNone(parsed)) return Option.none();
    github = `https://github.com/${parsed.value}`;
  }

  let answers: ReadonlyArray<{ question: string; answer: string }> = [];
  if (body.answers !== undefined) {
    const parsed = Schema.decodeUnknownOption(Answers)(body.answers);
    if (Option.isNone(parsed)) return Option.none();
    // Earn's schema keeps only these two keys.
    answers = parsed.value.map(({ question, answer }) => ({
      question,
      answer,
    }));
  }

  const telegram = Schema.decodeUnknownOption(TelegramUsername)(telegramInput);
  if (Option.isNone(telegram)) return Option.none();

  let lumaLink: string | undefined;
  if (isST) {
    if (!isString(body.lumaLink)) return Option.none();
    const trimmed = body.lumaLink.trim();
    const slug = extractLumaEventSlug(trimmed);
    if (!trimmed || !slug) return Option.none();
    lumaLink = `${LUMA_PREFIX}${slug}`;
  } else {
    if (!optionalText(body.lumaLink)) return Option.none();
    lumaLink = body.lumaLink;
  }
  const expenseOk = isST
    ? required(body.expenseBreakdown)
    : optionalText(body.expenseBreakdown);
  if (!expenseOk) return Option.none();

  // The cross-field checks (Earn's superRefine).
  if (!validateSolAddress(body.walletAddress)) return Option.none();

  // As in Earn, a profile link whose handle is under four characters ends
  // the checks here.
  const profileOk =
    X_USERNAME_REGEX.test(twitter) || twitterRegex.test(twitter);
  if (profileOk) {
    const handle = extractXHandle(twitter);
    if (handle && !isHandleVerified(handle, [...linkedTwitter])) {
      return Option.none();
    }
    for (const [index, question] of grant.questions.entries()) {
      const answer = answers[index]?.answer?.trim();
      if (!question.optional && !answer) return Option.none();
      if (
        answer &&
        question.type === 'link' &&
        !URL_REGEX.test(normalizeLinkAnswer(answer))
      ) {
        return Option.none();
      }
    }
    if (schemaFixedAsk !== undefined && ask !== schemaFixedAsk) {
      return Option.none();
    }
  }

  return Option.some({
    projectTitle: body.projectTitle,
    projectOneLiner: body.projectOneLiner,
    projectDetails: body.projectDetails,
    projectTimeline: textOrUndefined(body.projectTimeline),
    proofOfWork: textOrUndefined(body.proofOfWork),
    milestones: textOrUndefined(body.milestones),
    kpi: textOrUndefined(body.kpi),
    walletAddress: body.walletAddress,
    ask: getGrantFixedAsk(grant) ?? ask,
    twitter,
    github,
    answers,
    telegram: `https://t.me/${telegram.value}`,
    lumaLink,
    expenseBreakdown: textOrUndefined(body.expenseBreakdown),
  });
}

// Earn stores the deadline as "5 November 2026" (today, when the form had
// none, as for event grants).
export const timelineText = (projectTimeline: string | undefined) =>
  dayjs(projectTimeline).format('D MMMM YYYY');

// Earn's listing form rules, as its API checked them before saving (the
// form's own, createListingFormSchema and createListingRefinements in
// features/listing-builder/types/schema.ts, plus the API's: slug free,
// token allowed, fixed pay only): the shape decoded with Effect Schema,
// then each rule checked here. Pure:
// the database checks (slug taken, token allowed, region known) come in as
// facts.
import * as Schema from 'effect/Schema';

import { countries } from '@/constants/country';
import { type ParentSkills, skillSubSkillMap } from '@/interface/skills';
import { canonicalizeRegionValue } from '@/utils/canonicalRegion';

import {
  BONUS_REWARD_POSITION,
  MAX_BONUS_SPOTS,
  MAX_PODIUMS,
  MAX_REWARD,
} from '@/features/listing-builder/constants';
import {
  emailRegex,
  telegramRegex,
  twitterRegex,
} from '@/features/social/utils/regex';

const DAY = 86_400_000;

const nullish = <S extends Schema.Top>(schema: S) =>
  Schema.optional(Schema.NullOr(schema));

// What the builder sends (its form values, nulls for blanks). Anything
// else in the body is ignored, as zod's object did.
export const ListingBody = Schema.Struct({
  id: nullish(Schema.String),
  title: nullish(Schema.String),
  slug: nullish(Schema.String),
  pocSocials: nullish(Schema.String),
  description: nullish(Schema.String),
  type: nullish(Schema.String),
  region: nullish(Schema.String),
  referredBy: nullish(Schema.String),
  deadline: nullish(Schema.String),
  commitmentDate: nullish(Schema.String),
  templateId: nullish(Schema.String),
  eligibility: nullish(
    Schema.Array(
      Schema.Struct({
        order: Schema.Finite,
        question: Schema.String,
        type: Schema.String,
        optional: nullish(Schema.Boolean),
      }),
    ),
  ),
  skills: nullish(
    Schema.Array(
      Schema.Struct({
        skills: Schema.String,
        subskills: Schema.Array(Schema.String),
      }),
    ),
  ),
  token: nullish(Schema.String),
  rewardAmount: nullish(Schema.Finite),
  rewards: nullish(Schema.Record(Schema.String, Schema.NullOr(Schema.Finite))),
  compensationType: nullish(Schema.String),
  minRewardAsk: nullish(Schema.Finite),
  maxRewardAsk: nullish(Schema.Finite),
  maxBonusSpots: nullish(Schema.Finite),
  isFndnPaying: nullish(Schema.Boolean),
  isPrivate: nullish(Schema.Boolean),
  hackathonId: nullish(Schema.String),
});
export type ListingBody = typeof ListingBody.Type;

type Eligibility = ReadonlyArray<{
  readonly order: number;
  readonly question: string;
  readonly type: 'text' | 'link';
  readonly optional?: boolean | null;
}>;

type SkillsValue = ReadonlyArray<{
  readonly skills: ParentSkills;
  readonly subskills: ReadonlyArray<string>;
}>;

// A listing that passed every rule, normalized as zod's transforms left it.
export interface ValidListing {
  readonly id: string | null;
  readonly title: string;
  readonly slug: string;
  readonly pocSocials: string;
  readonly description: string;
  readonly type: 'bounty' | 'hackathon';
  readonly region: string;
  readonly referredBy: string | null;
  readonly deadline: string;
  readonly commitmentDate: string;
  readonly templateId: string | null;
  readonly eligibility: Eligibility | null;
  readonly skills: SkillsValue;
  readonly token: string;
  readonly rewardAmount: number | null;
  readonly rewards: Readonly<Record<string, number>> | null;
  readonly compensationType: 'fixed' | 'range' | 'variable';
  readonly minRewardAsk: number | null;
  readonly maxRewardAsk: number | null;
  readonly maxBonusSpots: number | null;
  readonly isFndnPaying: boolean;
  readonly isPrivate: boolean;
  readonly hackathonId: string | null;
}

export interface RuleContext {
  readonly isGod: boolean;
  readonly isEditing: boolean;
  // The sponsor is a Superteam chapter's.
  readonly isST: boolean;
  // The hackathon the body names, when it exists.
  readonly hackathon: {
    readonly id: string;
    readonly deadline: Date | null;
  } | null;
  // The saved deadline, when editing.
  readonly pastDeadline: Date | null;
  readonly now: number;
}

export type Errors = Readonly<Record<string, string>>;

// zod's datetime({ local: true, offset: true }).
const DATETIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)?$/;
const SLUG = /^-*[a-z0-9]+(?:-[a-z0-9]+)*-*$/;

const decimals = (value: number) =>
  (value.toString().split('.')[1] || '').length;

const isParentSkill = (value: string): value is ParentSkills =>
  Object.hasOwn(skillSubSkillMap, value);

const checkSkills = (
  skills: ListingBody['skills'],
): { value: SkillsValue } | { error: string } => {
  if (!skills || skills.length === 0) return { error: 'Required' };
  const value: Array<SkillsValue[number]> = [];
  for (const item of skills) {
    if (!isParentSkill(item.skills)) return { error: 'Invalid skill' };
    const known = skillSubSkillMap[item.skills].map((skill) => skill.value);
    if (!item.subskills.every((skill) => known.some((k) => k === skill))) {
      return { error: 'Invalid subskills for selected skill' };
    }
    value.push({ skills: item.skills, subskills: item.subskills });
  }
  if (new Set(value.map((item) => item.skills)).size !== value.length) {
    return { error: 'Duplicate parent skills are not allowed' };
  }
  return { value };
};

const checkRewards = (
  rewards: ListingBody['rewards'],
): { value: Record<string, number> | null } | { error: string } => {
  if (rewards === null || rewards === undefined) return { value: null };
  const value: Record<string, number> = {};
  for (const [key, amount] of Object.entries(rewards)) {
    if (Number.isNaN(Number(key))) return { error: 'Required' };
    if (typeof amount !== 'number' || Number.isNaN(amount)) {
      return { error: 'Required' };
    }
    if (amount < 0.01) return { error: 'Required' };
    if (amount > MAX_REWARD) return { error: 'Too big' };
    value[String(Number(key))] = amount;
  }
  const regular = Object.keys(value)
    .map(Number)
    .filter((position) => position !== BONUS_REWARD_POSITION)
    .toSorted((a, b) => a - b);
  if (regular.length > MAX_PODIUMS) {
    return { error: `Cannot exceed ${MAX_PODIUMS} reward positions` };
  }
  if (!regular.every((position, index) => position === index + 1)) {
    return { error: 'Reward positions must be sequential starting from 1' };
  }
  const bonus = value[BONUS_REWARD_POSITION];
  if (
    bonus !== undefined &&
    regular.reduce((sum, position) => sum + (value[position] || 0), 0) +
      bonus * MAX_BONUS_SPOTS >
      Number.MAX_SAFE_INTEGER
  ) {
    return { error: 'Total rewards amount exceeds maximum allowed value' };
  }
  return { value };
};

const askError = (value: number | null | undefined) => {
  if (value === null || value === undefined) return null;
  if (value < 0 || value > MAX_REWARD) return 'Invalid amount';
  if (decimals(value) > 4) return 'Maximum 4 decimal places allowed';
  return null;
};

// Every rule Earn's API applied to a listing being published or updated.
// `slugTaken` and `tokenAllowed` are what the database said.
export function validateListing(
  body: ListingBody,
  context: RuleContext,
  facts: { readonly slugTaken: boolean; readonly tokenAllowed: boolean },
): { readonly listing: ValidListing } | { readonly errors: Errors } {
  const errors: Record<string, string> = {};
  const fail = (path: string, message: string) => {
    errors[path] ??= message;
  };

  const title = (body.title ?? '').trim();
  if (!title) fail('title', 'Required');
  else if (title.length > 80) fail('title', 'Too long');
  else if (/[<>]/.test(title)) fail('title', 'HTML characters are not allowed');

  const rawSlug = (body.slug ?? '').trim();
  if (!rawSlug) fail('slug', 'Required');
  else if (rawSlug.length > 120) fail('slug', 'Too long');
  else if (!SLUG.test(rawSlug)) {
    fail(
      'slug',
      'Slug should only contain lowercase alphabets, numbers, and hyphens',
    );
  }
  const slug = rawSlug.replace(/^[-\s]+|[-\s]+$/g, '');
  if (facts.slugTaken) fail('slug', 'Slug already exists. Please try another.');

  const pocSocials = (body.pocSocials ?? '').trim();
  if (!pocSocials) fail('pocSocials', 'Required');
  else if (pocSocials.length > 256) fail('pocSocials', 'Too long');
  else if (
    !twitterRegex.test(pocSocials) &&
    !telegramRegex.test(pocSocials) &&
    !emailRegex.test(pocSocials)
  ) {
    fail(
      'pocSocials',
      'Please enter a valid X / Telegram link, or email address',
    );
  }

  const description = (body.description ?? '').trim();
  if (!description) fail('description', 'Required');

  const type = body.type ?? 'bounty';
  if (type !== 'bounty' && type !== 'hackathon') fail('type', 'Invalid type');
  else if (type === 'hackathon' && !context.hackathon) {
    fail('type', 'Hackathon is not allowed for now');
  }

  const region = canonicalizeRegionValue((body.region ?? 'Global').trim());
  if (!region || region.length > 256) fail('region', 'Invalid region selected');

  const referredBy = body.referredBy?.trim() ?? null;
  if (body.referredBy !== null && body.referredBy !== undefined) {
    if (!referredBy || referredBy.length > 256) fail('referredBy', 'Invalid');
  }

  const deadline = body.deadline?.trim() ?? '';
  const deadlineAt = Date.parse(deadline);
  if (!DATETIME.test(deadline) || Number.isNaN(deadlineAt)) {
    fail('deadline', 'Required');
  } else {
    if (!context.isGod && !(deadlineAt > context.now)) {
      fail('deadline', 'Deadline cannot be in the past');
    }
    if (
      context.isEditing &&
      !context.isGod &&
      context.pastDeadline &&
      deadlineAt > context.pastDeadline.getTime() + 14 * DAY
    ) {
      fail(
        'deadline',
        'Cannot extend deadline more than 2 weeks from original deadline',
      );
    }
  }

  const commitmentDate = body.commitmentDate?.trim() ?? '';
  const commitmentAt = Date.parse(commitmentDate);
  if (!DATETIME.test(commitmentDate) || Number.isNaN(commitmentAt)) {
    fail('commitmentDate', 'Required');
  }

  let eligibility: Eligibility | null = null;
  if (body.eligibility) {
    const questions: Array<Eligibility[number]> = [];
    body.eligibility.forEach((item, index) => {
      const question = item.question.trim();
      if (!question)
        fail(`eligibility.${index}.question`, 'Please add your question');
      else if (question.length > 200) {
        fail(
          `eligibility.${index}.question`,
          'Please limit your question to 200 characters max.',
        );
      }
      if (item.type !== 'text' && item.type !== 'link') {
        fail(`eligibility.${index}.type`, 'Invalid type');
        return;
      }
      questions.push({
        order: item.order,
        question,
        type: item.type,
        ...(item.optional === undefined ? {} : { optional: item.optional }),
      });
    });
    eligibility = questions;
  }

  const skills = checkSkills(body.skills);
  if ('error' in skills) fail('skills', skills.error);

  const token = (body.token ?? (context.isST ? 'USDG' : 'USDC')).trim();
  if (!token || !facts.tokenAllowed) fail('token', 'Token Not Allowed');

  const rewardAmount = body.rewardAmount ?? null;
  if (
    rewardAmount !== null &&
    (rewardAmount < 0 || rewardAmount > MAX_REWARD)
  ) {
    fail('rewardAmount', 'Invalid amount');
  }

  const rewards = checkRewards(body.rewards);
  if ('error' in rewards) fail('rewards', rewards.error);

  const compensationType = body.compensationType ?? 'fixed';
  if (
    compensationType !== 'fixed' &&
    compensationType !== 'range' &&
    compensationType !== 'variable'
  ) {
    fail('compensationType', 'Invalid compensation type');
  } else if (compensationType !== 'fixed') {
    fail('compensationType', 'Compensation type must be fixed');
  }

  const minRewardAsk = body.minRewardAsk ?? null;
  const maxRewardAsk = body.maxRewardAsk ?? null;
  const minError = askError(minRewardAsk);
  if (minError) fail('minRewardAsk', minError);
  const maxError = askError(maxRewardAsk);
  if (maxError) fail('maxRewardAsk', maxError);
  if (compensationType !== 'range') {
    if (minRewardAsk) fail('minRewardAsk', 'Should be empty');
    if (maxRewardAsk) fail('maxRewardAsk', 'Should be empty');
  }

  const maxBonusSpots = body.maxBonusSpots ?? null;
  if (maxBonusSpots !== null && maxBonusSpots < 0) {
    fail('maxBonusSpots', 'Required');
  } else if (maxBonusSpots !== null && maxBonusSpots > MAX_BONUS_SPOTS) {
    fail('maxBonusSpots', `# of Prizes cannot be more than ${MAX_BONUS_SPOTS}`);
  }

  const isFndnPaying = body.isFndnPaying ?? false;
  if (isFndnPaying && !context.isST) {
    fail(
      'isFndnPaying',
      'Foundation paying can only be enabled for Superteam listings',
    );
  }

  // createListingRefinements.
  const rewardsValue = 'value' in rewards ? rewards.value : null;
  if (compensationType === 'fixed') {
    if (!rewardAmount) {
      fail('rewards', 'Please fill in the rewards');
      fail('rewardAmount', 'Required');
    }
    if (!rewardsValue || Object.keys(rewardsValue).length === 0) {
      fail('rewards', 'Please fill in the rewards');
    }
    if (rewardsValue) {
      const total = Object.entries(rewardsValue).reduce(
        (sum, [position, value]) =>
          Number(position) === BONUS_REWARD_POSITION
            ? sum + value * (maxBonusSpots || 0)
            : sum + value,
        0,
      );
      if (Math.abs(total - (rewardAmount || 0)) > 0.0001) {
        fail('rewards', 'Total of rewards must equal the reward amount');
      }
      if (rewardsValue[BONUS_REWARD_POSITION] && !maxBonusSpots) {
        fail('maxBonusSpots', 'Required');
      }
    }
  }

  if (type === 'hackathon' && deadline && body.hackathonId) {
    const hackathonDeadline = context.hackathon?.deadline;
    if (
      !hackathonDeadline ||
      deadline !== new Date(hackathonDeadline).toISOString()
    ) {
      fail('deadline', 'Hackathon deadline cannot be changed');
    }
  }

  if (commitmentDate && deadline && !errors.commitmentDate) {
    if (commitmentAt < deadlineAt + DAY) {
      fail(
        'commitmentDate',
        'Winner announcement date must be at least 1 day after the deadline',
      );
    }
    if (commitmentAt > deadlineAt + 30 * DAY) {
      fail(
        'commitmentDate',
        'Winner announcement date must be no more than 30 days after the deadline',
      );
    }
  }

  // Non-fixed amounts must be empty (never reached: fixed is required).
  if (compensationType !== 'fixed') {
    if (rewardsValue) fail('rewards', 'Should be empty');
    if (rewardAmount) fail('rewardAmount', 'Should be empty');
    if (maxBonusSpots) fail('maxBonusSpots', 'Should be empty');
  }

  if (Object.keys(errors).length > 0 || !('value' in skills)) {
    return { errors };
  }
  return {
    listing: {
      id: body.id ?? null,
      title,
      slug,
      pocSocials,
      description,
      type: type === 'hackathon' ? 'hackathon' : 'bounty',
      region,
      referredBy,
      deadline,
      commitmentDate,
      templateId: body.templateId ?? null,
      eligibility,
      skills: skills.value,
      token,
      rewardAmount,
      rewards: rewardsValue,
      compensationType: 'fixed',
      minRewardAsk,
      maxRewardAsk,
      maxBonusSpots,
      isFndnPaying,
      isPrivate: body.isPrivate ?? false,
      hackathonId: body.hackathonId ?? null,
    },
  };
}

const normalizeRegion = (value: string) => value.trim().toLowerCase();

// The region a listing may be limited to, as Earn spells it (Global, an
// active chapter's region, or a country no chapter covers); null when it
// isn't one. Earn's getValidListingRegion.
export function allowedRegion(
  value: string | null | undefined,
  chapters: ReadonlyArray<{ readonly region: string; readonly code: string }>,
): string | null {
  const chapterCodes = new Set(
    chapters.map((chapter) => chapter.code.toLowerCase()).filter(Boolean),
  );
  const allowed = [
    'Global',
    ...chapters.map((chapter) => chapter.region),
    ...countries
      .filter((country) => country.iso)
      .filter((country) => !chapterCodes.has(country.code.toLowerCase()))
      .map((country) => country.name),
    ...countries
      .filter((country) => 'region' in country && country.region)
      .map((country) => country.name),
  ];
  const wanted = normalizeRegion(canonicalizeRegionValue(value || 'Global'));
  return allowed.find((region) => normalizeRegion(region) === wanted) ?? null;
}

// A chapter's sponsor may not widen a regional listing to Global.
export function widensToGlobal({
  currentRegion,
  nextRegion,
  hasChapter,
}: {
  readonly currentRegion: string | null | undefined;
  readonly nextRegion: string | null | undefined;
  readonly hasChapter: boolean;
}) {
  if (!hasChapter) return false;
  return (
    normalizeRegion(canonicalizeRegionValue(nextRegion || '')) === 'global' &&
    normalizeRegion(canonicalizeRegionValue(currentRegion || '')) !== 'global'
  );
}

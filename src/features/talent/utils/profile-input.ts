// Earn's rules for a talent profile (features/talent/schema `profileSchema`
// and `socialSuperRefine`), as the server checks them: the same messages,
// and the same values out (socials as profile URLs, location canonical).
// The forms keep checking with the zod schema for instant feedback.

import * as Schema from 'effect/Schema';

import {
  isSanctionedCountry,
  SANCTIONED_LOCATION_MESSAGE,
} from '@/constants/country';
import { URL_REGEX } from '@/constants/URL_REGEX';
import {
  type ParentSkills,
  skillSubSkillMap,
  type SubSkillsType,
} from '@/interface/skills';
import { canonicalizeRegionValue } from '@/utils/canonicalRegion';

import {
  IndustryList,
  USERNAME_PATTERN,
  web3Exp,
  workExp,
  workType,
} from '../constants';
import { hasDevSkills } from './skills';

const NullableString = Schema.NullOr(Schema.String);
const NullableStrings = Schema.NullOr(Schema.Array(Schema.String));

// What a profile form may send, by type. Anything else in the body is
// ignored, as Earn's allowed-fields filter did.
export const ProfileBody = Schema.Struct({
  username: Schema.optional(Schema.String),
  photo: Schema.optional(NullableString),
  firstName: Schema.optional(Schema.String),
  lastName: Schema.optional(Schema.String),
  bio: Schema.optional(Schema.String),
  discord: Schema.optional(Schema.String),
  twitter: Schema.optional(Schema.String),
  github: Schema.optional(Schema.String),
  linkedin: Schema.optional(Schema.String),
  telegram: Schema.optional(Schema.String),
  website: Schema.optional(Schema.String),
  community: Schema.optional(NullableStrings),
  interests: Schema.optional(NullableStrings),
  experience: Schema.optional(NullableString),
  cryptoExperience: Schema.optional(NullableString),
  workPrefernce: Schema.optional(NullableString),
  currentEmployer: Schema.optional(Schema.String),
  skills: Schema.optional(
    Schema.Array(
      Schema.Struct({
        skills: Schema.String,
        subskills: Schema.Array(Schema.String),
      }),
    ),
  ),
  private: Schema.optional(Schema.Boolean),
  location: Schema.optional(Schema.String),
});
export type ProfileBody = typeof ProfileBody.Type;

type SkillsValue = Array<{
  skills: ParentSkills;
  subskills: SubSkillsType[];
}>;

// The values as stored.
export interface ProfileData {
  username?: string;
  photo?: string | null;
  firstName?: string;
  lastName?: string;
  bio?: string;
  discord?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  telegram?: string;
  website?: string;
  community?: string[] | null;
  interests?: string[] | null;
  experience?: string | null;
  cryptoExperience?: string | null;
  workPrefernce?: string | null;
  currentEmployer?: string;
  skills?: SkillsValue;
  private?: boolean;
  location?: string;
}

export type FieldErrors = Record<string, string[]>;

// Earn's social profile URLs (features/social/utils/constants).
const PREFIX = {
  twitter: 'https://x.com/',
  github: 'https://github.com/',
  linkedin: 'https://linkedin.com/in/',
  telegram: 'https://t.me/',
} as const;

const shortMessage = (min: number) => `Minimum username length is ${min}.`;
const longMessage = (max: number) => `Maximum username length is ${max}.`;
const invalid = (allowed: string) =>
  `Invalid username. Only ${allowed} allowed.`;
const platformMessage = (name: string) =>
  `Please add your ${name.charAt(0).toUpperCase() + name.slice(1)} username here`;
const isUrl = (value: string) =>
  value.startsWith('https://') || value.startsWith('http://');

function lengthErrors(value: string, min: number, max: number): string[] {
  if (value.length < min) return [shortMessage(min)];
  if (value.length > max) return [longMessage(max)];
  return [];
}

function charErrors(value: string, allowed: RegExp, label: string): string[] {
  const errors: string[] = [];
  for (const char of value) {
    if (!allowed.test(char)) errors.push(invalid(label));
  }
  return errors;
}

// Each social's rules (features/social/utils/schema); zod stops at a
// failed length check, then runs the rest.
const SOCIAL_RULES = {
  discord: (value: string): string[] => {
    const length = lengthErrors(value, 2, 32);
    if (length.length) return length;
    const errors: string[] = [];
    if (value.toLowerCase() !== value) {
      errors.push('Username must be in lowercase only.');
    }
    if (isUrl(value)) errors.push(platformMessage('discord'));
    for (let i = 0; i < value.length; i++) {
      const char = value[i] ?? '';
      if (!/[a-z0-9._]/.test(char)) {
        errors.push(invalid(`letters, numbers, '_' and '.'`));
      }
      if (char === '.' && i > 0 && value[i - 1] === '.') {
        errors.push("Username cannot contain consecutive '.'");
      }
    }
    return errors;
  },
  twitter: (value: string): string[] => {
    const length = lengthErrors(value, 1, 15);
    if (length.length) return length;
    return [
      ...(isUrl(value) ? [platformMessage('twitter')] : []),
      ...charErrors(value, /[a-zA-Z0-9_]/, `letters, numbers and '_'`),
    ];
  },
  linkedin: (value: string): string[] => {
    const length = lengthErrors(value, 3, 100);
    if (length.length) return length;
    return [
      ...(isUrl(value) ? [platformMessage('linkedin')] : []),
      ...charErrors(value, /[a-zA-Z0-9-]/, `letters, numbers and '-'`),
      ...(value.endsWith('-') ? ['Username cannot end with a dash'] : []),
    ];
  },
  telegram: (value: string): string[] => {
    const length = lengthErrors(value, 5, 32);
    if (length.length) return length;
    return [
      ...(/^[a-zA-Z]/.test(value)
        ? []
        : ['Username must start with a letter.']),
      ...(isUrl(value) ? [platformMessage('telegram')] : []),
      ...charErrors(value, /[a-zA-Z0-9_]/, `letters, numbers and '_' `),
    ];
  },
  github: (value: string): string[] => {
    const length = lengthErrors(value, 1, 39);
    if (length.length) return length;
    return [
      ...(isUrl(value) ? [platformMessage('github')] : []),
      ...charErrors(value, /[a-zA-Z0-9-]/, `letters, numbers and '-'`),
    ];
  },
} as const;

const isParentSkill = (name: string): name is ParentSkills =>
  Object.hasOwn(skillSubSkillMap, name);
const NAME = /^[A-Za-z\s]+$/;

function checkSkills(
  skills: NonNullable<ProfileBody['skills']>,
): { readonly error: string } | { readonly skills: SkillsValue } {
  const valid: SkillsValue = [];
  for (const item of skills) {
    const parent = item.skills;
    if (!isParentSkill(parent)) return { error: 'Invalid enum value' };
    const allowed: ReadonlyArray<string> = skillSubSkillMap[parent].map(
      (skill) => skill.value,
    );
    const isAllowed = (skill: string): skill is SubSkillsType =>
      allowed.includes(skill);
    const subskills = item.subskills.filter(isAllowed);
    if (subskills.length !== item.subskills.length) {
      return { error: 'Invalid subskills for selected skill' };
    }
    valid.push({ skills: parent, subskills });
  }
  if (valid.length === 0) return { error: 'Required' };
  if (new Set(valid.map((item) => item.skills)).size !== valid.length) {
    return { error: 'Duplicate parent skills are not allowed' };
  }
  return { skills: valid };
}

const oneOf = (list: ReadonlyArray<string>, value: string) =>
  list.includes(value);

// Checks the fields the body has (zod's `.pick` of them) and gives back
// the values as Earn stores them, or each field's messages.
export function checkProfile(
  body: ProfileBody,
):
  | { readonly ok: true; readonly data: ProfileData }
  | { readonly ok: false; readonly errors: FieldErrors } {
  const errors: FieldErrors = {};
  const data: ProfileData = {};
  const fail = (key: string, messages: string[]) => {
    if (messages.length) errors[key] = messages;
    return messages.length === 0;
  };

  if (body.username !== undefined) {
    const value = body.username;
    if (!value) fail('username', ['Username is required']);
    else if (value.length > 40) {
      fail('username', ['Username cannot exceed 40 characters']);
    } else if (!USERNAME_PATTERN.test(value)) {
      fail('username', [
        `Username can only contain lowercase letters, numbers, '_', and '-'`,
      ]);
    } else data.username = value.replace(/^[-\s]+|[-\s]+$/g, '');
  }
  if (body.photo !== undefined) data.photo = body.photo;
  for (const key of ['firstName', 'lastName'] as const) {
    const value = body[key];
    if (value === undefined) continue;
    const label = key === 'firstName' ? 'First name' : 'Last name';
    if (!value) fail(key, [`${label} is required`]);
    else if (!NAME.test(value)) {
      fail(key, [`${label} can only contain letters and spaces`]);
    } else data[key] = value;
  }
  if (body.bio !== undefined) {
    if (body.bio.length > 180)
      fail('bio', ['Bio cannot exceed 180 characters']);
    else data.bio = body.bio;
  }
  if (body.discord !== undefined) {
    if (!body.discord || fail('discord', SOCIAL_RULES.discord(body.discord))) {
      data.discord = body.discord;
    }
  }
  for (const key of ['twitter', 'github', 'linkedin', 'telegram'] as const) {
    const value = body[key];
    if (value === undefined) continue;
    if (!value) data[key] = '';
    else if (fail(key, SOCIAL_RULES[key](value))) {
      data[key] = `${PREFIX[key]}${value}`;
    }
  }
  if (body.website !== undefined) {
    if (body.website && !URL_REGEX.test(body.website)) {
      fail('website', ['Invalid URL']);
    } else data.website = body.website;
  }
  if (body.community !== undefined) {
    data.community = body.community ? [...body.community] : null;
  }
  if (body.interests !== undefined) {
    const interests = body.interests;
    if (interests && !interests.every((item) => oneOf(IndustryList, item))) {
      fail('interests', ['Invalid Industry']);
    } else data.interests = interests ? [...interests] : null;
  }
  const choices = [
    ['experience', workExp, 'Invalid Work Experience'],
    ['cryptoExperience', web3Exp, 'Invalid Crypto Experience'],
    ['workPrefernce', workType, 'Invalid Work Preference'],
  ] as const;
  for (const [key, list, message] of choices) {
    const value = body[key];
    if (value === undefined) continue;
    if (value && !oneOf(list, value)) fail(key, [message]);
    else data[key] = value;
  }
  if (body.currentEmployer !== undefined) {
    data.currentEmployer = body.currentEmployer;
  }
  if (body.skills !== undefined) {
    const result = checkSkills(body.skills);
    if ('error' in result) fail('skills', [result.error]);
    else data.skills = result.skills;
  }
  if (body.private !== undefined) data.private = body.private;
  if (body.location !== undefined) {
    const location = canonicalizeRegionValue(body.location);
    if (isSanctionedCountry(location)) {
      fail('location', [SANCTIONED_LOCATION_MESSAGE]);
    } else data.location = location;
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, data };
}

// Earn's `socialSuperRefine`: developers need GitHub, everyone else X.
export function socialErrors(data: ProfileData): FieldErrors {
  if (data.skills && hasDevSkills(data.skills)) {
    return data.github ? {} : { github: ['Github is required'] };
  }
  return data.twitter ? {} : { twitter: ['X is required'] };
}

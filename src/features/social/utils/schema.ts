import { z } from 'zod';

import { URL_REGEX } from '@/constants';

import { socials, type SocialType } from './constants';

function invalidCharacterMessage(_: string, allowed: string) {
  return `Invalid username. Use only ${allowed}.`;
}

function usernameShortMessage(min: number) {
  return `Username is too short. Minimum length is ${min}.`;
}
function usernameLongMessage(max: number) {
  return `Username is too long. Maximum length is ${max}.`;
}

function transformedUrl(name: SocialType, username: string) {
  return `${socials.find((s) => s.name === name)?.prefix}${username}`;
}

// DISCORD
// - Length: 2-32
// - Allowed: a-z, 0-9, '_', '.'
// - Must be lowercase
// - No consecutive '.'
export const discordUsernameSchema = z
  .string()
  .min(2, { message: usernameShortMessage(2) })
  .max(32, { message: usernameLongMessage(32) })
  .superRefine((val, ctx) => {
    // Check lowercase
    if (val.toLowerCase() !== val) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Username must be in lowercase only.',
      });
    }

    // Check allowed chars and no consecutive dots
    for (let i = 0; i < val.length; i++) {
      const char = val[i] || '';
      if (!/[a-z0-9._]/.test(char)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: invalidCharacterMessage(
            char,
            'letters, numbers, underscore (_) and dots (.)',
          ),
        });
      }
      if (char === '.' && i > 0 && val[i - 1] === '.') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Username cannot contain consecutive '.'",
        });
      }
    }
  });
// No transform for Discord

// TWITTER
// - Length: 4-15
// - Allowed: a-z, A-Z, 0-9, '_'
// - Transform: https://x.com/<username>
export const twitterUsernameSchema = z
  .string()
  .min(4, { message: usernameShortMessage(4) })
  .max(15, { message: usernameLongMessage(15) })
  .superRefine((val, ctx) => {
    for (const char of val) {
      if (!/[a-zA-Z0-9_]/.test(char)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: invalidCharacterMessage(
            char,
            'letters, numbers and underscore (_)',
          ),
        });
      }
    }
  })
  .transform((val) => transformedUrl('twitter', val));

// LINKEDIN
// - Length: 3-100
// - Allowed: letters, numbers and dashes
// - Not Allowed: Cannot end with dash
// - Transform: https://www.linkedin.com/in/<username>
export const linkedinUsernameSchema = z
  .string()
  .min(3, { message: usernameShortMessage(3) })
  .max(100, { message: usernameLongMessage(100) })
  .superRefine((val, ctx) => {
    for (const char of val) {
      if (!/[a-zA-Z0-9-]/.test(char)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: invalidCharacterMessage(
            char,
            'letters, numbers and hyphens (-)',
          ),
        });
      }
    }
    // Ensure it doesn't start or end with dash
    if (val.endsWith('-')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Username cannot end with a dash',
      });
    }
  })
  .transform((val) => transformedUrl('linkedin', val));

// TELEGRAM
// - Length: 5-32
// - Allowed: letters (a-z, A-Z), numbers (0-9), underscore (_)
// - Must start with letter
// - Case-insensitive, transform to lowercase
// - Transform: https://t.me/<username>
export const telegramUsernameSchema = z
  .string()
  .min(5, { message: usernameShortMessage(5) })
  .max(32, { message: usernameLongMessage(32) })
  .superRefine((val, ctx) => {
    if (!/^[a-zA-Z]/.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Username must start with a letter.',
      });
    }

    for (const char of val) {
      if (!/[a-zA-Z0-9_]/.test(char)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: invalidCharacterMessage(
            char,
            'letters, numbers and underscore (_)',
          ),
        });
      }
    }
  })
  .transform((val) => transformedUrl('telegram', val));

// GITHUB
// - Length: 1-39
// - Allowed: letters (a-z, A-Z), numbers (0-9), '-'
// - Cannot start or end with '-'
// - No consecutive '--'
// - Transform to lowercase: https://github.com/<username>
export const githubUsernameSchema = z
  .string()
  .min(1, { message: usernameShortMessage(1) })
  .max(39, { message: usernameLongMessage(39) })
  .superRefine((val, ctx) => {
    // Check chars
    for (const char of val) {
      if (!/[a-zA-Z0-9-]/.test(char)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: invalidCharacterMessage(
            char,
            'letters, numbers and hyphens (-)',
          ),
        });
      }
    }

    if (val.startsWith('-')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Username cannot start with '-'.",
      });
    }

    if (val.endsWith('-')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Username cannot end with '-'.",
      });
    }

    if (val.includes('--')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Username cannot contain consecutive '-'.",
      });
    }
  })
  .transform((val) => transformedUrl('github', val));

export const websiteUrlSchema = z.union([
  z.literal(''),
  z.string().regex(URL_REGEX, 'Invalid URL'),
]);

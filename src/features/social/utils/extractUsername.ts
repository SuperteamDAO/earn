import { z } from 'zod';

import { telegramRegex, twitterRegex } from './regex';

export function extractTwitterUsername(input: string): string | null {
  const match = input.match(twitterRegex);
  if (match && match[2]) {
    return match[2].startsWith('@') ? match[2].slice(1) : match[2];
  }
  const usernameRegex = /^@?([a-zA-Z0-9_]{1,90})$/;
  const usernameMatch = input.match(usernameRegex);
  if (usernameMatch && usernameMatch[0]) {
    return usernameMatch[0].startsWith('@')
      ? usernameMatch[0].slice(1)
      : usernameMatch[0];
  }
  return null;
}

export function extractTelegramUsername(input: string): string | null {
  const urlMatch = input.match(telegramRegex);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].startsWith('@') ? urlMatch[1].slice(1) : urlMatch[1];
  }

  const usernameRegex = /^@?[a-zA-Z0-9_]{5,90}$/;
  const usernameMatch = input.match(usernameRegex);
  if (usernameMatch && usernameMatch[0]) {
    return usernameMatch[0].startsWith('@')
      ? usernameMatch[0].slice(1)
      : usernameMatch[0];
  }

  return null;
}

const urlPatterns = {
  twitter: /^(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([^/]+)\/?$/,
  linkedin: /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/([^/]+)\/?$/,
  github: /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/?$/,
  telegram: /^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/([^/]+)\/?$/,
};

export const lowercaseOnly = z.enum(['discord']);

export const removeAtSign = (value: string) => value.replace('@', '');

export const linkedUsernames = z.enum([
  'linkedin',
  'twitter',
  'github',
  'telegram',
]);
type LinkedUsernames = z.infer<typeof linkedUsernames>;
export function extractSocialUsername(
  platform: LinkedUsernames,
  url: string,
): string | null {
  const pattern = urlPatterns[platform];
  if (!pattern) return null;

  const match = url.trim().match(pattern);
  if (match && match[1]) {
    if (lowercaseOnly.safeParse(platform).success) {
      return match[1].toLowerCase();
    }
    return match[1];
  }

  return null;
}

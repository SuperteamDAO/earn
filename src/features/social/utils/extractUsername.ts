import { z } from 'zod';

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

  const match = url?.trim().match(pattern);
  if (match && match[1]) {
    if (lowercaseOnly.safeParse(platform).success) {
      return match[1].toLowerCase();
    }
    return match[1];
  }

  return null;
}

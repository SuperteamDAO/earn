import { emailRegex } from '@/features/social/utils/regex';

export const getURLSanitized = (url: string): string => {
  const trimmedUrl = url.trim();

  if (!trimmedUrl || trimmedUrl === '-' || trimmedUrl === '#') {
    return trimmedUrl;
  }

  if (emailRegex?.test(trimmedUrl)) {
    return `mailto:${trimmedUrl}`;
  }

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith('/')) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
};

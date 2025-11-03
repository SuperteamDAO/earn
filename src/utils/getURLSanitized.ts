import { emailRegex } from '@/features/social/utils/regex';

export const getURLSanitized = (url: string) => {
  if (!url || url === '-' || url === '#') return url;

  const isEmail = emailRegex?.test(url);

  if (isEmail) {
    return `mailto:${url}`;
  }

  if (
    !url.includes('https://') &&
    !url.includes('http://') &&
    !url.includes('www')
  ) {
    return `https://${url}`;
  }

  return url;
};

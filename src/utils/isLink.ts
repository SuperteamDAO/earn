import { URL_REGEX } from '@/constants/URL_REGEX';

export const isLink = (text: string) => {
  return URL_REGEX.test(text);
};

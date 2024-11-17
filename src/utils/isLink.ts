import { URL_REGEX } from '@/constants';

export const isLink = (text: string) => {
  return URL_REGEX.test(text);
};

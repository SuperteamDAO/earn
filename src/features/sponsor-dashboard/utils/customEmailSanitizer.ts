import { domPurify } from '@/lib/domPurify';

const EMAIL_ALLOWED_TAGS = ['a', 'br', 'em', 'li', 'ol', 'p', 'strong', 'ul'];

const EMAIL_ALLOWED_ATTR = ['href', 'rel', 'target'];

const normalizeHtml = (html: string) => html.trim().replace(/\s+/g, ' ');

export const getCustomEmailPlainText = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

export const sanitizeCustomEmailBody = (html: string) =>
  domPurify(html, {
    ALLOWED_TAGS: EMAIL_ALLOWED_TAGS,
    ALLOWED_ATTR: EMAIL_ALLOWED_ATTR,
  }).trim();

export const validateCustomEmailBody = (html: string) => {
  const sanitized = sanitizeCustomEmailBody(html);

  if (!getCustomEmailPlainText(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: 'Email body cannot be empty.',
    };
  }

  if (normalizeHtml(sanitized) !== normalizeHtml(html)) {
    return {
      isValid: false,
      sanitized,
      error:
        'Email body contains unsupported or unsafe HTML. Please remove scripts, embeds, or unsupported formatting.',
    };
  }

  return {
    isValid: true,
    sanitized,
    error: null,
  };
};

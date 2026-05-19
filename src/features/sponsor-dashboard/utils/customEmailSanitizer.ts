import { domPurify } from '@/lib/domPurify';

const EMAIL_ALLOWED_TAGS = ['a', 'br', 'em', 'li', 'ol', 'p', 'strong', 'ul'];

const EMAIL_ALLOWED_ATTR = ['href', 'rel', 'target'];
export const CUSTOM_EMAIL_MAX_CHARS = 5000;

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

export const validateCustomEmailNote = ({
  noteHtml,
  fullEmailHtml,
}: {
  noteHtml: string;
  fullEmailHtml: string;
}) => {
  const sanitized = sanitizeCustomEmailBody(noteHtml);
  const fullEmailPlainText = getCustomEmailPlainText(fullEmailHtml);

  if (!getCustomEmailPlainText(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: 'Custom note cannot be empty.',
    };
  }

  if (normalizeHtml(sanitized) !== normalizeHtml(noteHtml)) {
    return {
      isValid: false,
      sanitized,
      error:
        'Custom note contains unsupported or unsafe HTML. Please remove scripts, embeds, or unsupported formatting.',
    };
  }

  if (fullEmailPlainText.length > CUSTOM_EMAIL_MAX_CHARS) {
    return {
      isValid: false,
      sanitized,
      error: `Email must be ${CUSTOM_EMAIL_MAX_CHARS.toLocaleString()} characters or fewer including the note.`,
    };
  }

  return {
    isValid: true,
    sanitized,
    error: null,
  };
};

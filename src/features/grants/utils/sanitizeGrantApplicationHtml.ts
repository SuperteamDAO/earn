import { domPurify } from '@/lib/domPurify';

const GRANT_APPLICATION_ALLOWED_TAGS = [
  'a',
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  's',
  'blockquote',
  'pre',
  'code',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
  'span',
];

const GRANT_APPLICATION_ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'title',
  'colspan',
  'rowspan',
  'class',
];

const GRANT_APPLICATION_FORBID_TAGS = [
  'script',
  'iframe',
  'style',
  'meta',
  'link',
  'object',
  'embed',
  'base',
  'form',
  'img',
  'svg',
  'math',
];

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&(?:#0*60|#x0*3c|lt);?/gi, '<')
    .replace(/&(?:#0*62|#x0*3e|gt);?/gi, '>')
    .replace(/&(?:#0*34|#x0*22|quot);?/gi, '"')
    .replace(/&(?:#0*39|#x0*27|apos);?/gi, "'")
    .replace(/&amp;?/gi, '&');

export const sanitizeGrantApplicationHtml = (value?: string | null) =>
  domPurify(decodeHtmlEntities(value || ''), {
    ALLOWED_TAGS: GRANT_APPLICATION_ALLOWED_TAGS,
    ALLOWED_ATTR: GRANT_APPLICATION_ALLOWED_ATTR,
    FORBID_TAGS: GRANT_APPLICATION_FORBID_TAGS,
  });

export const sanitizeGrantApplicationText = (value?: string | null) =>
  domPurify(decodeHtmlEntities(value || ''), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

export function sanitizeGrantApplicationAnswers<
  TAnswer extends { answer: string },
>(answers?: TAnswer[]) {
  return answers?.map((answer) => ({
    ...answer,
    answer: sanitizeGrantApplicationHtml(answer.answer),
  }));
}

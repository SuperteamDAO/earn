import IsoDomPurify from 'isomorphic-dompurify';

const DESCRIPTION_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
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
    'img',
  ],
  ALLOWED_ATTR: [
    'href',
    'target',
    'rel',
    'src',
    'alt',
    'title',
    'width',
    'height',
    'colspan',
    'rowspan',
    'class',
  ],
  FORBID_TAGS: [
    'script',
    'iframe',
    'style',
    'meta',
    'link',
    'object',
    'embed',
    'base',
    'form',
  ],
};

// Produces the same HTML string on the server and the client, so the
// description can be server-rendered without hydration mismatches.
export function getDescriptionHtml(
  description: string | undefined,
  h1ClassName: string,
): string {
  let normalized = description ?? '';
  if (normalized.startsWith('"')) {
    try {
      normalized = JSON.parse(normalized) as string;
    } catch {
      normalized = description ?? '';
    }
  }

  const fragment = IsoDomPurify.sanitize(normalized, {
    ...DESCRIPTION_SANITIZE_CONFIG,
    RETURN_DOM_FRAGMENT: true,
  });
  const doc = fragment.ownerDocument;

  fragment.querySelectorAll('p').forEach((p) => {
    if (p.childNodes.length === 0) p.replaceWith(doc.createElement('br'));
  });

  fragment.querySelectorAll('h1').forEach((h1) => {
    const h2 = doc.createElement('h2');
    for (const { name, value } of Array.from(h1.attributes)) {
      h2.setAttribute(name, value);
    }
    h2.className = h1ClassName;
    h2.append(...Array.from(h1.childNodes));
    h1.replaceWith(h2);
  });

  fragment.querySelectorAll('a').forEach((a) => {
    a.setAttribute('href', a.getAttribute('href') ?? '');
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });

  const container = doc.createElement('div');
  container.append(fragment);
  return container.innerHTML;
}

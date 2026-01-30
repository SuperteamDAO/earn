import parse, {
  domToReact,
  type HTMLReactParserOptions,
} from 'html-react-parser';
import { useMemo } from 'react';

import { domPurify } from '@/lib/domPurify';

interface Props {
  description?: string;
}

const parserOptions: HTMLReactParserOptions = {
  replace: (domNode: any) => {
    const { name, children, attribs } = domNode;
    if (name === 'p' && (!children || children.length === 0)) {
      return <br />;
    }
    if (name === 'a' && attribs) {
      return (
        <a {...attribs} target="_blank" rel="noopener noreferrer">
          {domToReact(children, parserOptions)}
        </a>
      );
    }
    return domNode;
  },
};

const ALLOWED_TAGS = [
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
];

const ALLOWED_ATTR = [
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
];

const FORBID_TAGS = [
  'script',
  'iframe',
  'style',
  'meta',
  'link',
  'object',
  'embed',
  'base',
  'form',
];

export default function HtmlContent({ description }: Props) {
  const content = useMemo(() => {
    if (!description) return null;

    let normalizedDescription = description;
    if (normalizedDescription.startsWith('"')) {
      try {
        normalizedDescription = JSON.parse(normalizedDescription) as string;
      } catch {
        normalizedDescription = description;
      }
    }

    return parse(
      domPurify(normalizedDescription, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        FORBID_TAGS,
      }),
      parserOptions,
    );
  }, [description]);

  return <>{content}</>;
}

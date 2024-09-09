import { Link } from '@chakra-ui/react';

import { isLink } from '@/utils/isLink';
import { truncateString } from '@/utils/truncateString';

interface Props {
  text: string;
}
function parseLinks(answer: string) {
  const parts = answer.split(/(\s+|@[\w]+)/g).filter(Boolean);
  return parts.map((part) => {
    if (isLink(part)) {
      return { type: 'link', value: part };
    }
    return { type: 'text', value: part };
  });
}
export function LinkTextParser({ text }: Props) {
  const parsedTextLinks = parseLinks(text);
  return (
    <>
      {parsedTextLinks.map((part, index) => {
        if (part.type === 'link') {
          let href = part.value;
          if (!href.startsWith('http://') && !href.startsWith('https://')) {
            href = 'https://' + href;
          }
          return (
            <Link
              key={index}
              color="brand.purple"
              href={href}
              isExternal
              rel="nofollow noreferrer"
            >
              {truncateString(part.value, 30)}
            </Link>
          );
        } else {
          return <span key={index}>{part.value}</span>;
        }
      })}
    </>
  );
}

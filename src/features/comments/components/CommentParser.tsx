import { useAtomValue } from 'jotai';
import Link from 'next/link';

import { type CommentType } from '@/interface/comments';
import { isLink } from '@/utils/isLink';
import { truncateString } from '@/utils/truncateString';

import { validUsernamesAtom } from '../atoms';

interface Props {
  value: string;
  type: CommentType;
  isAnnounced: boolean;
  submissionId?: string;
}

export const CommentParser = ({
  value,
  type,
  submissionId,
  isAnnounced,
}: Props) => {
  const validUsernames = useAtomValue(validUsernamesAtom);

  function parseComment(comment: string) {
    const tokens = comment.split(/(\s+|@\w+[\w-]*|[^\s@]+)/g).filter(Boolean);

    return tokens.map((token) => {
      const mentionMatch = token.match(/^@(\w+[\w-]*)/);
      if (mentionMatch && validUsernames.includes(mentionMatch[1] || '')) {
        return { type: 'mention', value: mentionMatch[0] };
      }

      if (isLink(token)) {
        return { type: 'link', value: token };
      }

      return { type: 'text', value: token };
    });
  }

  if (type === 'SUBMISSION' && submissionId && isAnnounced) {
    return (
      <>
        {value} -{' '}
        <Link
          href={`/feed/submission/${submissionId}`}
          className="text-brand-purple hover:underline"
        >
          check it out!
        </Link>
      </>
    );
  }

  const parsedComment = parseComment(value);

  return (
    <>
      {parsedComment.map((part, index) => {
        if (part.type === 'mention') {
          return (
            <Link
              key={index}
              href={`/t/${part.value.substring(1)}`}
              className="text-brand-purple hover:underline"
            >
              {truncateString(part.value, 12)}
            </Link>
          );
        } else if (part.type === 'link') {
          let href = part.value;
          if (!href.startsWith('http://') && !href.startsWith('https://')) {
            href = 'https://' + href;
          }
          return (
            <a
              key={index}
              href={href}
              className="text-blue-600 hover:text-blue-700 hover:underline"
              target="_blank"
              rel="nofollow noreferrer"
            >
              {truncateString(part.value, 30)}
            </a>
          );
        } else {
          return <span key={index}>{part.value}</span>;
        }
      })}
    </>
  );
};

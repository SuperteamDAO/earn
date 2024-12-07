import { useAtomValue } from 'jotai';
import Link from 'next/link';

import { type CommentType } from '@/interface/comments';
import { isLink } from '@/utils/isLink';
import { truncateString } from '@/utils/truncateString';

import { validUsernamesAtom } from '../atoms';

interface Props {
  listingSlug: string;
  listingType: string;
  value: string;
  type: CommentType;
  isAnnounced: boolean;
  submissionId?: string;
}

export const CommentParser = ({
  value,
  type,
  submissionId,
  listingSlug,
  listingType,
  isAnnounced,
}: Props) => {
  const validUsernames = useAtomValue(validUsernamesAtom);

  function parseComment(comment: string) {
    const parts = comment.split(/(\s+|@[a-z0-9_-]+)/g).filter(Boolean);
    return parts.map((part) => {
      if (
        part.startsWith('@') &&
        part.length > 1 &&
        validUsernames.includes(part.split('@')[1] || '')
      ) {
        return { type: 'mention', value: part };
      } else if (isLink(part)) {
        return { type: 'link', value: part };
      }
      return { type: 'text', value: part };
    });
  }

  const parsedComment = parseComment(value);

  if (type === 'SUBMISSION' && submissionId && isAnnounced) {
    return (
      <>
        {value} -{' '}
        <Link
          href={`/listings/${listingType}/${listingSlug}/submission/${submissionId}`}
          className="text-brand-purple hover:underline"
        >
          check it out!
        </Link>
      </>
    );
  }

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

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import type { ListingPageSubmission } from '@/interface/submission';
import { dayjs } from '@/utils/dayjs';

import type { Listing } from '../../types';
import { SubmissionCard } from './SubmissionCard';

// Earn stores likes as a JSON list of who liked and when.
const likesOf = (like: unknown): { id: string; date: number }[] =>
  Array.isArray(like)
    ? like.filter(
        (entry): entry is { id: string; date: number } =>
          typeof entry === 'object' &&
          entry !== null &&
          'id' in entry &&
          typeof entry.id === 'string',
      )
    : [];

interface Props {
  bounty: Listing;
  submissions: ListingPageSubmission[];
  endTime: string;
  // After a like; the page loads again by default.
  onUpdate?: () => void;
}
export const SubmissionList = ({
  bounty,
  submissions,
  endTime,
  onUpdate,
}: Props) => {
  const router = useRouter();
  const update = onUpdate ?? (() => router.refresh());
  const [isEndTimePassed, setIsEndTimePassed] = useState(false);

  // After hydration: the server's clock may differ from the browser's.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setIsEndTimePassed(dayjs(endTime).valueOf() < Date.now());
  }, [endTime]);

  return (
    <div className="mt-4 flex min-h-screen w-full flex-col items-center md:items-start">
      {isEndTimePassed ? (
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-2">
          <div className="grid w-full grid-cols-1 gap-5 px-3 md:grid-cols-2 md:gap-20 md:px-6 xl:grid-cols-3">
            {submissions?.map((submission) => {
              return (
                <SubmissionCard
                  id={submission.id}
                  likes={likesOf(submission.like)}
                  talent={submission.user}
                  key={submission.id}
                  winner={!!bounty?.isWinnersAnnounced && submission.isWinner}
                  link={submission.link ?? ''}
                  onUpdate={update}
                  winnerPosition={submission.winnerPosition}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex h-[25rem] w-full flex-col items-center justify-center gap-5">
          <ExternalImage alt={'submission'} src={'/icons/submission.svg'} />
          <p className="text-center text-2xl font-semibold text-gray-800">
            Submissions are not public until the submission deadline
            <br />
            has closed. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
};

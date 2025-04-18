import React, { type Dispatch, type SetStateAction } from 'react';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import type { SubmissionWithUser } from '@/interface/submission';
import { dayjs } from '@/utils/dayjs';

import { type Listing } from '../../types';
import { SubmissionCard } from './SubmissionCard';
import { sponsorshipSubmissionStatus } from './SubmissionTable';

interface Props {
  bounty: Listing;
  submissions: SubmissionWithUser[];
  endTime: string;
  setUpdate: Dispatch<SetStateAction<boolean>>;
}
export const SubmissionList = ({
  bounty,
  submissions,
  endTime,
  setUpdate,
}: Props) => {
  const isSponsorship = bounty.type === 'sponsorship';

  return (
    <>
      <div className="mt-10 flex min-h-screen w-full flex-col items-center md:items-start">
        {isSponsorship || dayjs(endTime).valueOf() < Date.now() ? (
          <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-2">
            <div className="grid w-full grid-cols-1 gap-5 px-3 md:grid-cols-2 md:gap-20 md:px-6 xl:grid-cols-3">
              {submissions?.map((submission) => {
                return (
                  <SubmissionCard
                    id={submission.id}
                    likes={
                      (submission.like as unknown as {
                        id: string;
                        date: number;
                      }[]) ?? []
                    }
                    talent={submission.user}
                    key={submission.id}
                    winner={
                      !!bounty?.isWinnersAnnounced && !!submission.isWinner
                    }
                    link={submission.link ?? ''}
                    setUpdate={setUpdate}
                    status={
                      isSponsorship
                        ? sponsorshipSubmissionStatus(submission)
                        : undefined
                    }
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
    </>
  );
};

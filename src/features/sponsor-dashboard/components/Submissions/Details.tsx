import { useAtomValue } from 'jotai';
import React from 'react';

import { cn } from '@/utils/cn';
import { getURLSanitized } from '@/utils/getURLSanitized';

import { type Listing } from '@/features/listings/types';

import { selectedSubmissionAtom } from '../../atoms';
import { InfoBox } from '../InfoBox';
import { Notes } from './Notes';

interface Props {
  bounty: Listing | undefined;
  isHackathonPage?: boolean;
}

export const Details = ({ bounty, isHackathonPage }: Props) => {
  const selectedSubmission = useAtomValue(selectedSubmissionAtom);
  const isProject = bounty?.type === 'project';

  return (
    <div className="flex max-h-[39.7rem] w-full">
      <div
        className={cn(
          'scrollbar-thumb-rounded-full scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 flex flex-1 flex-col overflow-y-auto p-4',
          !isHackathonPage ? 'w-2/3' : 'w-full',
        )}
      >
        {!isProject && (
          <>
            <InfoBox
              label="Main Submission"
              content={
                selectedSubmission?.link
                  ? getURLSanitized(selectedSubmission?.link)
                  : '-'
              }
            />
            <InfoBox
              label="Tweet Link"
              content={
                selectedSubmission?.tweet
                  ? getURLSanitized(selectedSubmission?.tweet)
                  : '-'
              }
            />
          </>
        )}
        {bounty?.compensationType !== 'fixed' && (
          <InfoBox
            label="Ask"
            content={`${selectedSubmission?.ask?.toLocaleString('en-us')} ${bounty?.token}`}
          />
        )}

        {selectedSubmission?.eligibilityAnswers &&
          selectedSubmission.eligibilityAnswers.map((answer: any) => (
            <InfoBox
              key={answer.question}
              label={answer.question}
              content={answer.answer}
              isHtml
            />
          ))}
        <InfoBox
          label="Anything Else"
          content={selectedSubmission?.otherInfo}
          isHtml
        />
      </div>
      {!isHackathonPage && (
        <div className="w-1/3 max-w-[20rem] p-4">
          {selectedSubmission && !isHackathonPage && (
            <Notes
              key={selectedSubmission.id}
              submissionId={selectedSubmission.id}
              initialNotes={selectedSubmission.notes}
              slug={bounty?.slug}
            />
          )}
        </div>
      )}
    </div>
  );
};

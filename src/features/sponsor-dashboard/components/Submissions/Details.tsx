import { useAtomValue } from 'jotai';
import React from 'react';

import { type Listing } from '@/features/listings';
import { getURLSanitized } from '@/utils/getURLSanitized';

import { selectedSubmissionAtom } from '../..';
import { InfoBox } from '../InfoBox';
import { Notes } from './Notes';

interface Props {
  bounty: Listing | undefined;
}

export const Details = ({ bounty }: Props) => {
  const selectedSubmission = useAtomValue(selectedSubmissionAtom);
  const isProject = bounty?.type === 'project';

  return (
    <div className="scrollbar-thumb-rounded-full flex h-[32.6rem] w-full overflow-y-scroll scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300">
      <div className="flex w-full flex-1 flex-col border-r border-slate-200 p-4">
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
      <div className="w-1/4 p-4">
        {selectedSubmission && (
          <Notes
            key={selectedSubmission.id}
            submissionId={selectedSubmission.id}
            initialNotes={selectedSubmission.notes}
            slug={bounty?.slug}
          />
        )}
      </div>
    </div>
  );
};

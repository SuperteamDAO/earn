import { useAtomValue } from 'jotai';
import React from 'react';

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
    <div className="flex h-[32.6rem] w-full">
      <div className="scrollbar-thumb-rounded-full scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 flex w-full flex-1 flex-col overflow-y-auto p-4">
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
        <div className="w-1/4 border-l border-slate-200 p-4">
          {selectedSubmission && !isHackathonPage && (
            <Notes key={selectedSubmission.id} slug={bounty?.slug} />
          )}
        </div>
      )}
    </div>
  );
};

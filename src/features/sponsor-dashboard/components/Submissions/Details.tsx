import { useAtomValue } from 'jotai';
import React from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
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
      <ScrollArea
        className={cn(
          'flex flex-1 flex-col overflow-y-auto p-4',
          !isHackathonPage ? 'w-2/3' : 'w-full',
        )}
        type="auto"
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
      </ScrollArea>
      {!isHackathonPage && (
        <div className="w-1/3 max-w-[20rem] p-4">
          {selectedSubmission && !isHackathonPage && (
            <Notes key={selectedSubmission.id} slug={bounty?.slug} />
          )}
        </div>
      )}
    </div>
  );
};

import dayjs from 'dayjs';
import { type Atom, useAtomValue } from 'jotai';
import React from 'react';

import { tokenList } from '@/constants/tokenList';
import { type SubmissionWithUser } from '@/interface/submission';
import { cn } from '@/utils/cn';
import { getURLSanitized } from '@/utils/getURLSanitized';

import { DescriptionUI } from '@/features/listings/components/ListingPage/DescriptionUI';
import { type Listing } from '@/features/listings/types';

import { selectedSubmissionAtom } from '../../atoms';
import { InfoBox } from '../InfoBox';
import { Notes } from './Notes';

interface Props {
  bounty: Listing | undefined;
  modalView?: boolean;
  atom?: Atom<SubmissionWithUser | undefined>;
}

export const Details = ({ bounty, modalView, atom }: Props) => {
  const selectedSubmission = useAtomValue(atom ?? selectedSubmissionAtom);
  const isProject = bounty?.type === 'project';
  const isSponsorship = bounty?.type === 'sponsorship';
  const isUsdBased = bounty?.token === 'Any';
  const token = isUsdBased ? selectedSubmission?.token : bounty?.token;
  const tokenObject = tokenList.find((t) => t.tokenSymbol === token);

  return (
    <div
      className={cn(
        'flex h-[32.6rem] w-full',
        modalView ? 'mx-auto h-full max-w-3xl' : 'border-r border-slate-200',
      )}
    >
      <div
        className={cn(
          'scrollbar-thumb-rounded-full flex w-full flex-1 flex-col scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300',
          modalView ? 'mt-3' : 'overflow-y-auto p-4',
        )}
      >
        {bounty?.compensationType !== 'fixed' && (
          <div className="mb-4">
            <p className="mt-1 text-xs font-semibold uppercase text-slate-400">
              Ask
            </p>
            <div className="flex w-full items-center overflow-visible">
              <img
                src={tokenObject?.icon}
                alt={tokenObject?.tokenSymbol}
                className="h-4 w-4 rounded-full"
              />
              <span className="ml-1 text-sm">
                {isUsdBased && '$'}
                {selectedSubmission?.ask?.toLocaleString('en-us')}
                <span className="text-slate-400">
                  {isUsdBased && ' to be paid in'}
                </span>
                <span
                  className={cn(
                    'ml-1',
                    !isUsdBased && 'font-semibold text-slate-400',
                  )}
                >
                  {token}
                </span>
              </span>
            </div>
          </div>
        )}

        <InfoBox
          label="Application Date"
          content={`${dayjs(selectedSubmission?.createdAt).format('DD MMM YYYY')}`}
        />

        {!isProject && !isSponsorship && (
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
        {selectedSubmission?.eligibilityAnswers &&
          selectedSubmission.eligibilityAnswers.map(
            (answer: any, i: number) => {
              if (
                selectedSubmission.listing?.eligibility?.[i]?.type ===
                'paragraph'
              ) {
                return (
                  <div className="mb-4" key={answer.question}>
                    <p className="mt-1 text-xs font-semibold uppercase text-slate-400">
                      {answer.question}
                    </p>
                    <DescriptionUI description={answer.answer} />
                  </div>
                );
              }
              return (
                <InfoBox
                  key={answer.question}
                  label={answer.question}
                  content={answer.answer}
                  isHtml
                />
              );
            },
          )}
        <InfoBox
          label="Anything Else"
          content={selectedSubmission?.otherInfo}
          isHtml
        />
      </div>
      {!modalView && (
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
      )}
    </div>
  );
};

'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils/cn';
import { getURLSanitized } from '@/utils/getURLSanitized';

import type { ReviewListing } from '../../utils/review-rules';
import { InfoBox } from '../InfoBox';
import { Notes } from './Notes';
import { useReview } from './review-state';
import { TweetStats } from './TweetStats';

interface Props {
  bounty: ReviewListing;
  isHackathonPage?: boolean;
}

const isTweetStatusUrl = (url: string | undefined | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  try {
    const trimmed = url.trim();
    const urlWithProtocol = trimmed.startsWith('http')
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(urlWithProtocol);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes('twitter.com') && !host.includes('x.com')) {
      return false;
    }
    const segments = parsed.pathname.split('/').filter(Boolean);
    const statusIndex = segments.indexOf('status');
    const statusId = segments[statusIndex + 1];
    return (
      statusIndex !== -1 &&
      typeof statusId === 'string' &&
      /^\d+$/.test(statusId)
    );
  } catch {
    return false;
  }
};

export const Details = ({ isHackathonPage }: Props) => {
  const { selected: selectedSubmission } = useReview();

  return (
    <div className="flex max-h-[39.7rem] w-full">
      <ScrollArea
        className={cn(
          'flex flex-1 flex-col overflow-y-auto p-4',
          !isHackathonPage ? 'w-2/3' : 'w-full',
        )}
        type="auto"
      >
        {
          <>
            <InfoBox
              label="Main Submission"
              content={
                selectedSubmission?.link
                  ? getURLSanitized(selectedSubmission?.link)
                  : '-'
              }
            />
            {selectedSubmission &&
              isTweetStatusUrl(selectedSubmission.link) && (
                <TweetStats
                  key={`${selectedSubmission.id}-link`}
                  source="link"
                  submissionId={selectedSubmission.id}
                />
              )}
            <InfoBox
              label="Tweet Link"
              content={
                selectedSubmission?.tweet
                  ? getURLSanitized(selectedSubmission?.tweet)
                  : '-'
              }
            />
            {selectedSubmission &&
              isTweetStatusUrl(selectedSubmission.tweet) && (
                <TweetStats
                  key={`${selectedSubmission.id}-tweet`}
                  source="tweet"
                  submissionId={selectedSubmission.id}
                />
              )}
          </>
        }
        {selectedSubmission?.eligibilityAnswers &&
          selectedSubmission.eligibilityAnswers.map((answer) => (
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
        <div className="w-1/3 max-w-[22.5rem] p-4">
          {selectedSubmission && !isHackathonPage && (
            <Notes key={selectedSubmission.id} />
          )}
        </div>
      )}
    </div>
  );
};

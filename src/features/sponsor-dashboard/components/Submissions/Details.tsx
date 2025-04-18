import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import dayjs from 'dayjs';
import { type Atom, useAtomValue } from 'jotai';
import { Info } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip } from '@/components/ui/tooltip';
import { tokenList } from '@/constants/tokenList';
import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';
import { cn } from '@/utils/cn';
import { getURLSanitized } from '@/utils/getURLSanitized';

import { Comments } from '@/features/comments/components/Comments';
import { DescriptionUI } from '@/features/listings/components/ListingPage/DescriptionUI';
import { type Listing } from '@/features/listings/types';

import { selectedSubmissionAtom } from '../../atoms';
import { InfoBox, parseHtml } from '../InfoBox';
import { Notes } from './Notes';
import SubmissionStatusExplanation from './SubmissionStatusExplainer';

interface Props {
  bounty: Listing | undefined;
  externalView?: boolean;
  atom?: Atom<SubmissionWithUser | undefined>;
}

type ActionTab = 'notes' | 'comments';

export const Details = ({ bounty, externalView, atom }: Props) => {
  const selectedSubmission = useAtomValue(atom ?? selectedSubmissionAtom);
  const isProject = bounty?.type === 'project';
  const isSponsorship = bounty?.type === 'sponsorship';
  const isUsdBased = bounty?.token === 'Any';
  const token = isUsdBased ? selectedSubmission?.token : bounty?.token;
  const tokenObject = tokenList.find((t) => t.tokenSymbol === token);
  const [commentCount, setCommentCount] = useState(0);
  const [activeTab, setActiveTab] = useState<ActionTab>('notes');

  useEffect(() => {
    if (externalView) return;
    const fetchCommentCount = async () => {
      if (selectedSubmission?.id) {
        try {
          const response = await api.get(
            `/api/comment/${selectedSubmission.id}`,
            {
              params: {
                skip: 0,
                take: 1,
              },
            },
          );
          setCommentCount(response.data.count);
        } catch (error) {
          console.error('Error fetching comment count:', error);
        }
      }
    };

    fetchCommentCount();
  }, [selectedSubmission?.id]);

  return (
    <div
      className={cn(
        'flex h-[34rem] w-full',
        externalView ? 'h-full max-w-3xl' : 'border-r border-slate-200',
      )}
    >
      <div
        className={cn(
          'scrollbar-thumb-rounded-full flex w-full flex-1 flex-col scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300',
          externalView ? 'mt-3' : 'overflow-y-auto p-4',
        )}
      >
        <div className="mb-4">
          <SubmissionStatusExplanation submission={selectedSubmission} />
        </div>
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

        {selectedSubmission?.otherTokenDetails && (
          <InfoBox
            label="Payment Details"
            isHtml
            content={selectedSubmission?.otherTokenDetails}
          />
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
              const description =
                selectedSubmission.listing?.eligibility?.[i]?.description;
              if (
                selectedSubmission.listing?.eligibility?.[i]?.type ===
                'checkbox'
              ) {
                return (
                  <div className="mb-4" key={answer.question}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={answer.answer === 'true'}
                        className="cursor-not-allowed opacity-50"
                        disabled
                      />
                      <InfoBox
                        content={answer.question}
                        className="mb-0"
                        isHtml={true}
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div key={answer.question} className="mb-4">
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold uppercase text-slate-400">
                    {answer.question}
                    {description && (
                      <Tooltip
                        content={description}
                        contentProps={{
                          className: 'whitespace-pre-wrap text-wrap',
                        }}
                      >
                        <Info className="size-3 text-slate-300 hover:text-slate-400" />
                      </Tooltip>
                    )}
                  </p>
                  {selectedSubmission.listing?.eligibility?.[i]?.type ===
                  'paragraph' ? (
                    <DescriptionUI description={answer.answer} />
                  ) : (
                    <div
                      id="reset-des"
                      className={cn('h-full w-full overflow-visible')}
                    >
                      {parseHtml(answer.answer)}
                    </div>
                  )}
                </div>
              );
            },
          )}
        <InfoBox
          label="Anything Else"
          content={selectedSubmission?.otherInfo}
          isHtml
        />
      </div>
      {!externalView && selectedSubmission && (
        <div className="w-1/3 border-l">
          <Tabs
            defaultValue="notes"
            value={activeTab}
            onValueChange={(tab) => setActiveTab(tab as ActionTab)}
            className="w-full"
          >
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-none">
              <TabsTrigger
                value="notes"
                className={cn(
                  'h-auto rounded-none border-b-2 px-4 py-2 text-muted-foreground data-[state=active]:border-brand-purple',
                )}
              >
                Notes
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className={cn(
                  'h-auto rounded-none border-b-2 px-4 py-2 text-muted-foreground data-[state=active]:border-brand-purple',
                )}
              >
                Comments: {commentCount}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="p-0">
              <div className="max-h-[32rem] overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300">
                <Notes
                  key={selectedSubmission?.id}
                  submissionId={selectedSubmission?.id}
                  initialNotes={selectedSubmission?.notes}
                  slug={bounty?.slug}
                />
              </div>
            </TabsContent>
            <TabsContent value="comments" className="p-0">
              <div className="max-h-[30rem] overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="font-semibold">Public Comments</span>
                  <Tooltip content="Comments visible to the contributor and other users. Great for leaving public feedback, asking questions, or acknowledging work.">
                    <Info className="size-4 text-slate-300 hover:text-slate-400" />
                  </Tooltip>
                </div>
                <div className="mb-6 mt-4 border-b border-slate-200" />
                <Comments
                  hideCount
                  isAnnounced={false}
                  listingSlug={''}
                  listingType={''}
                  poc={undefined}
                  sponsorId={undefined}
                  isVerified={false}
                  refId={selectedSubmission.id}
                  refType={'SUBMISSION'}
                  count={commentCount}
                  setCount={setCommentCount}
                  take={2}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

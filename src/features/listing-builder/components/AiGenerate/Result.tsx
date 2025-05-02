import { type BountyType } from '@prisma/client';
import { Baseline, Link2, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useWatch } from 'react-hook-form';

import { type TRewardsGenerateResponse } from '@/app/api/sponsor-dashboard/ai-generate/rewards/route';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { MinimalTiptapEditor } from '@/components/tiptap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { tokenList } from '@/constants/tokenList';
import { type Skills } from '@/interface/skills';
import { Wand } from '@/svg/wand';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { Twitter } from '@/features/social/components/SocialIcons';
import { devSkills } from '@/features/talent/utils/skills';

import { useListingForm } from '../../hooks';
import { type TEligibilityQuestion } from '../../types/schema';
import {
  calculateTotalPrizes,
  calculateTotalRewardsForPodium,
} from '../../utils/rewards';
import { TokenLabel } from '../Form/Rewards/Tokens/TokenLabel';

function hasProperRewards(
  rewards: TRewardsGenerateResponse | undefined,
): boolean {
  if (
    rewards?.compensationType === 'fixed' &&
    Object.keys(rewards?.rewards || {}).length > 0 &&
    !!rewards.rewards['1']
  )
    return true;
  if (
    rewards?.compensationType === 'range' &&
    rewards?.minRewardAsk &&
    rewards?.maxRewardAsk
  )
    return true;
  if (rewards?.compensationType === 'variable') return true;
  return false;
}

interface AiGenerateResultProps {
  description: string;
  token: string;
  isDescriptionLoading: boolean;
  isDescriptionError: boolean;
  title: string;
  isTitleIdle: boolean;
  isTitleError: boolean;
  isTitlePending: boolean;
  eligibilityQuestions: TEligibilityQuestion[];
  isEligibilityQuestionsIdle: boolean;
  isEligibilityQuestionsError: boolean;
  isEligibilityQuestionsPending: boolean;
  skills: Skills;
  isSkillsIdle: boolean;
  isSkillsError: boolean;
  isSkillsPending: boolean;
  rewards: TRewardsGenerateResponse | undefined;
  isRewardsIdle: boolean;
  isRewardsError: boolean;
  isRewardsPending: boolean;
  onInsert: () => void;
  onBack: () => void;
}

export function AiGenerateResult({
  description,
  token,
  isDescriptionLoading,
  isDescriptionError,
  title,
  isTitleIdle,
  isTitleError,
  isTitlePending,
  eligibilityQuestions,
  isEligibilityQuestionsIdle,
  isEligibilityQuestionsError,
  isEligibilityQuestionsPending,
  skills,
  isSkillsIdle,
  isSkillsError,
  isSkillsPending,
  rewards,
  isRewardsIdle,
  isRewardsError,
  isRewardsPending,
  onInsert,
  onBack,
}: AiGenerateResultProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const listingForm = useListingForm();
  const type = useWatch({
    control: listingForm.control,
    name: 'type',
  });

  const isActionsDisabled = useMemo(
    () =>
      isDescriptionLoading || isEligibilityQuestionsPending || isRewardsPending,
    [isDescriptionLoading, isEligibilityQuestionsPending, isRewardsPending],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [description, eligibilityQuestions, isDescriptionLoading]);

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 1);
  }, [isDescriptionLoading]);

  return (
    <div className="space-y-4">
      <div>
        <span className="flex items-start gap-2">
          <span className="flex items-center gap-2">
            <Wand />
            <h2 className="text-xl font-semibold">
              Use AI to generate your description
            </h2>
          </span>
          <Badge
            variant="secondary"
            className="ml-auto h-fit px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase"
          >
            {type}
          </Badge>
        </span>
        <p className="font-medium text-gray-500">
          Answer a few short questions and we will generate your description for
          you
        </p>
      </div>

      <ScrollArea className="flex max-h-150 min-h-1 flex-col gap-y-4 overflow-y-auto">
        <div>
          <h3 className="text-sm font-medium text-slate-600">
            Generated Result
          </h3>
          <div className="mt-2 rounded-md border bg-white px-4 py-2">
            {isDescriptionLoading ? (
              <div className="minimal-tiptap-editor tiptap ProseMirror h-min w-full overflow-visible px-0! pb-7">
                <div className="tiptap ProseMirror listing-description mt-0! px-0!">
                  <MarkdownRenderer>{description}</MarkdownRenderer>
                </div>
              </div>
            ) : (
              <MinimalTiptapEditor
                key={isDescriptionLoading ? 1 : 0}
                value={description}
                immediatelyRender
                throttleDelay={0}
                output="html"
                editable={false}
                imageSetting={{
                  folderName: 'listing-description',
                  type: 'description',
                }}
                className="min-h-0 border-0 shadow-none"
                editorClassName="!px-0"
                toolbarClassName="hidden"
              />
            )}
            {isDescriptionError && (
              <p className="w-full rounded-md bg-slate-100 py-4 text-center text-sm text-slate-600">
                {`Failed to generate description, please try again later`}
              </p>
            )}
          </div>
        </div>
        {((isTitleIdle && title.length > 0) ||
          (!isTitleIdle && !isTitleError)) && (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <h3 className="text-sm font-medium text-slate-600">Title</h3>
            {isTitlePending && (
              <span className="flex animate-pulse items-center justify-center gap-2 rounded-md bg-slate-100 py-4 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                <p>Generating Title</p>
              </span>
            )}
            {title.length > 0 && (
              <>
                <div className="flex w-full items-center rounded-md border border-slate-200 bg-slate-50 py-3 pl-3">
                  <p className="font-medium">{title}</p>
                </div>
              </>
            )}
          </div>
        )}
        {((isRewardsIdle && hasProperRewards(rewards)) ||
          (!isRewardsIdle && !isRewardsError)) && (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <h3 className="text-sm font-medium text-slate-600">Rewards</h3>
            {isRewardsPending ? (
              <span className="flex animate-pulse items-center justify-center gap-2 rounded-md bg-slate-100 py-4 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                <p>Generating Rewards</p>
              </span>
            ) : (
              <>
                {!hasProperRewards(rewards) || isRewardsError ? (
                  <></>
                ) : (
                  <div className="flex w-full items-center rounded-md border border-slate-200 bg-slate-50 py-3 pl-3">
                    <RewardResults
                      token={token}
                      rewards={rewards}
                      type={type}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {((isSkillsIdle && skills.length > 0) ||
          (!isSkillsIdle && !isSkillsError)) && (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <h3 className="text-sm font-medium text-slate-600">Skills</h3>
            {isSkillsPending ? (
              <span className="flex animate-pulse items-center justify-center gap-2 rounded-md bg-slate-100 py-4 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                <p>Generating Skills</p>
              </span>
            ) : (
              <>
                {skills.length === 0 || isSkillsError ? (
                  <></>
                ) : (
                  <div>
                    <SkillsResult skills={skills} />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {((isEligibilityQuestionsIdle && eligibilityQuestions.length > 0) ||
          (!isEligibilityQuestionsIdle && !isEligibilityQuestionsError)) && (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <h3 className="text-sm font-medium text-slate-600">Questions</h3>
            {type !== 'project' && (
              <>
                <div className="flex items-center rounded-md border">
                  <span className="flex items-center justify-center self-stretch border-r px-4 text-slate-400">
                    <Link2 className="h-4 w-4" />
                  </span>
                  <p className="px-4 py-2 text-sm text-slate-500">
                    Bounty submission link{' '}
                    <span className="pl-1 text-red-500">*</span>
                  </p>
                </div>
                <div className="flex items-center rounded-md border">
                  <span className="flex items-center justify-center self-stretch border-r px-4 text-slate-400">
                    <Twitter className="h-4 w-4 text-slate-400 opacity-100 grayscale-0" />
                  </span>
                  <p className="px-4 py-2 text-sm text-slate-500">
                    Twitter post link
                  </p>
                </div>
              </>
            )}
            {isEligibilityQuestionsPending && (
              <span className="flex animate-pulse items-center justify-center gap-2 rounded-md bg-slate-100 py-4 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                <p>Generating Custom Questions</p>
              </span>
            )}
            {eligibilityQuestions.map((question) => (
              <div
                className="flex items-center rounded-md border"
                key={question.order}
              >
                <span className="flex items-center justify-center self-stretch border-r px-4 text-slate-400">
                  {question.type === 'link' ? (
                    <Link2 className="h-4 w-4" />
                  ) : (
                    <Baseline className="h-4 w-4" />
                  )}
                </span>
                <p className="px-4 py-2 text-sm text-slate-500">
                  {question.question}
                  <span className="pl-1 text-red-500">*</span>
                </p>
              </div>
            ))}
            {type === 'project' && (
              <>
                {type === 'project' &&
                  rewards &&
                  rewards?.compensationType !== 'fixed' && (
                    <div className="flex items-center rounded-md border">
                      <span className="flex items-center justify-center self-stretch border-r px-4 text-slate-400">
                        <TokenLabel
                          symbol={token}
                          showIcon
                          classNames={{
                            amount: 'font-medium text-base ml-0',
                            symbol: 'font-medium text-base mr-0',
                            icon: 'mr-0',
                          }}
                        />
                      </span>
                      <p className="px-4 py-2 text-sm text-slate-500">
                        Compensation Quote
                        <span className="pl-1 text-red-500">*</span>
                      </p>
                    </div>
                  )}
                <div className="flex items-center rounded-md border">
                  <span className="flex items-center justify-center self-stretch border-r px-4 text-slate-400">
                    <Baseline className="h-4 w-4" />
                  </span>
                  <p className="px-4 py-2 text-sm text-slate-500">
                    Anything Else
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </ScrollArea>

      <div className="flex flex-col items-center">
        <Button
          onClick={onInsert}
          className="w-full bg-indigo-500 hover:bg-indigo-600"
          disabled={isActionsDisabled}
        >
          Insert
        </Button>
        <Button variant="link" onClick={onBack} disabled={isActionsDisabled}>
          Go Back
        </Button>
      </div>
    </div>
  );
}

function RewardResults({
  rewards,
  type,
  token: tokenSymbol,
}: {
  rewards: TRewardsGenerateResponse | undefined;
  type: BountyType;
  token: string;
}) {
  const token = tokenList.find(
    (s) => s.tokenSymbol === (tokenSymbol || 'USDC'),
  );
  const totalPrizes = useMemo(
    () => calculateTotalPrizes(rewards?.rewards, rewards?.maxBonusSpots || 0),
    [rewards?.rewards, rewards?.maxBonusSpots],
  );
  const totalReward = useMemo(
    () =>
      calculateTotalRewardsForPodium(
        rewards?.rewards || {},
        rewards?.maxBonusSpots || 0,
      ),
    [rewards?.rewards, rewards?.maxBonusSpots],
  );
  if (type !== 'project') {
    return (
      <>
        <TokenLabel
          token={token}
          showIcon
          showSymbol
          amount={totalReward || 0}
          classNames={{
            amount: 'font-medium text-base',
          }}
          formatter={(n) => formatNumberWithSuffix(n) + '' || '0'}
        />
        <p className="ml-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap text-slate-400 capitalize">
          | {totalPrizes} {totalPrizes === 1 ? 'Prize' : 'Prizes'}
        </p>
      </>
    );
  } else {
    if (rewards?.compensationType === 'fixed') {
      return (
        <>
          <TokenLabel
            token={token}
            showIcon
            showSymbol
            amount={totalReward || 0}
            classNames={{
              amount: 'font-medium text-base',
            }}
            formatter={(n) => formatNumberWithSuffix(n) + '' || '0'}
          />
          <p className="ml-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap text-slate-400 capitalize">
            | Fixed Prize
          </p>
        </>
      );
    } else if (rewards?.compensationType === 'range') {
      return (
        <>
          <TokenLabel
            token={token}
            showIcon
            amount={rewards?.minRewardAsk || 0}
            classNames={{
              amount: 'font-medium text-base mr-0',
            }}
            formatter={(n) => formatNumberWithSuffix(n) + '' || '0'}
            className="mr-1"
          />
          <p>-</p>
          <TokenLabel
            token={token}
            showIcon={false}
            showSymbol
            className="ml-1"
            amount={rewards?.maxRewardAsk || 0}
            classNames={{
              amount: 'font-medium text-base ml-0',
            }}
            formatter={(n) => formatNumberWithSuffix(n) + '' || '0'}
          />
          <p className="ml-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap text-slate-400 capitalize">
            | Range Prize
          </p>
        </>
      );
    } else if (rewards?.compensationType === 'variable') {
      <>
        <TokenLabel
          token={token}
          showIcon
          showSymbol
          classNames={{
            amount: 'font-medium text-base ml-0',
            symbol: 'font-medium text-base',
          }}
        />
        <p className="ml-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap text-slate-400 capitalize">
          | Variable Prize
        </p>
      </>;
    }
  }
  return (
    <>
      <TokenLabel
        token={token}
        showIcon
        showSymbol
        classNames={{
          amount: 'font-medium text-base ml-0',
          symbol: 'font-medium text-base',
        }}
      />
      <p className="ml-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap text-slate-400 capitalize">
        | Variable Prize
      </p>
    </>
  );
}

function SkillsResult({ skills }: { skills: Skills }) {
  return (
    <div className="flex flex-wrap gap-3 rounded-md border border-slate-200 bg-white p-3">
      {skills.map((skillGroup) => (
        <div key={skillGroup.skills} className="flex flex-wrap">
          {devSkills.includes(skillGroup.skills) && (
            <span className="mt-1 mr-1.5 inline-block rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 transition-colors">
              {skillGroup.skills}
            </span>
          )}
          {skillGroup.subskills.length > 0 ? (
            skillGroup.subskills.map((subskill) => (
              <span
                key={subskill}
                className="mt-1 mr-1.5 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 transition-colors"
              >
                {subskill}
              </span>
            ))
          ) : (
            <></>
          )}
        </div>
      ))}
    </div>
  );
}

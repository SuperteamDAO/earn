import { TriangleAlert } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

const Countdown = dynamic(() => import('react-countdown'), { ssr: false });

import MdTimer from '@/components/icons/MdTimer';
import TbBriefcase2 from '@/components/icons/TbBriefcase2';
import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { exclusiveSponsorData } from '@/constants/exclusiveSponsors';
import { tokenList } from '@/constants/tokenList';
import { useServerTimeSync } from '@/hooks/use-server-time';
import { type ParentSkills } from '@/interface/skills';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { cleanRewardPrizes } from '@/utils/rank';

import { RelatedListings } from '@/features/home/components/RelatedListings';

import type { Listing } from '../../types';
import { isDeadlineOver } from '../../utils/deadline';
import { ApprovalStages } from '../Submission/ApprovalStages';
import { SubmissionActionButton } from '../Submission/SubmissionActionButton';
import { CompensationAmount } from './CompensationAmount';
import { ExtraInfoSection } from './ExtraInfoSection';
import { PrizesList } from './PrizesList';

const ListingWinners = dynamic(
  () => import('./ListingWinners').then((m) => m.ListingWinners),
  { ssr: false },
);

function digitsInLargestString(numbers: string[]): number {
  const largest = numbers.reduce((max, current) => {
    const cleanedCurrent = current.replace(/[,\.]/g, '');
    const cleanedMax = max.replace(/[,\.]/g, '');

    return cleanedCurrent.length > cleanedMax.length
      ? current
      : cleanedCurrent.length === cleanedMax.length &&
          cleanedCurrent > cleanedMax
        ? current
        : max;
  }, '');

  return largest.replace(/[,\.]/g, '').length;
}

function getOrdinalSuffix(day: number): string {
  const teenRange = day % 100;
  if (teenRange >= 11 && teenRange <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

export function RightSideBar({
  listing,
  skills,
  isTemplate = false,
  submissionNumber,
  isSubmissionNumberLoading = false,
}: {
  listing: Listing;
  skills?: ParentSkills[];
  isTemplate?: boolean;
  submissionNumber?: number;
  isSubmissionNumberLoading?: boolean;
}) {
  const {
    token,
    type,
    deadline,
    rewards,
    rewardAmount,
    compensationType,
    maxRewardAsk,
    minRewardAsk,
    Hackathon,
    maxBonusSpots,
    isWinnersAnnounced,
    isPro,
  } = listing;

  const { serverTime, isSync } = useServerTimeSync();

  const hasHackathonStarted = Hackathon?.startDate
    ? dayjs().isAfter(Hackathon.startDate)
    : true;

  const submissionRange = useMemo(() => {
    if (submissionNumber === undefined) return '';
    if (submissionNumber <= 10) return '0-10';
    if (submissionNumber <= 25) return '10-25';
    if (submissionNumber <= 50) return '25-50';
    if (submissionNumber <= 100) return '50-100';
    if (submissionNumber <= 200) return '100-200';
    if (submissionNumber <= 300) return '200-300';
    return '300+';
  }, [submissionNumber]);

  const isProject = type === 'project';

  const router = useRouter();

  const largestDigits = useMemo(() => {
    const consideringDigitsArray = cleanRewardPrizes(rewards).map(
      (c) => formatNumberWithSuffix(c, 2, true) + (token || '') + '',
    );
    consideringDigitsArray.push(
      formatNumberWithSuffix(rewardAmount || 0, 2, true) + (token || '') + '',
    );
    return digitsInLargestString(consideringDigitsArray);
  }, [rewards, token, rewardAmount]);

  const showUsdSymbolOnly = useMemo(() => {
    if (listing?.Hackathon?.slug === 'mobius') return true;
    else return false;
  }, [listing]);

  const widthOfPrize = useMemo(() => {
    let calculateWidthOfPrize: string | number = largestDigits - 0.75;
    if (cleanRewardPrizes(rewards).length > 6) {
      calculateWidthOfPrize = largestDigits + 0.5;
    }
    calculateWidthOfPrize = calculateWidthOfPrize + 'rem';
    if (compensationType === 'range') {
      calculateWidthOfPrize = '90%';
    }
    return calculateWidthOfPrize;
  }, [largestDigits, rewards]);

  const inReview =
    isDeadlineOver(deadline, serverTime()) && !isWinnersAnnounced;

  return (
    <div className="h-full w-full md:w-auto">
      <div className="flex w-full flex-col gap-2 pt-4">
        <div className="flex w-full flex-col justify-center rounded-xl bg-white">
          {!router.asPath.split('/')[4]?.includes('submission') &&
            listing.isWinnersAnnounced && (
              <div className="block w-full pb-6 md:hidden">
                <ListingWinners bounty={listing} />
              </div>
            )}
          <div className="flex w-full flex-col justify-between px-1 pb-4">
            <div className="w-full">
              <table className="w-full">
                <tbody>
                  <tr className="w-full">
                    <td className="w-full p-0" colSpan={3}>
                      <div
                        className={cn(
                          'flex items-center gap-2',
                          showUsdSymbolOnly && 'ml-6',
                        )}
                      >
                        {!showUsdSymbolOnly && (
                          <img
                            className="h-8 w-8 rounded-full"
                            alt="token icon"
                            src={
                              tokenList.find((e) => e?.tokenSymbol === token)
                                ?.icon ?? '/assets/dollar.svg'
                            }
                          />
                        )}
                        <CompensationAmount
                          compensationType={compensationType}
                          rewardAmount={rewardAmount}
                          maxRewardAsk={maxRewardAsk}
                          minRewardAsk={minRewardAsk}
                          token={!showUsdSymbolOnly ? token : 'USD'}
                          isWinnersAnnounced={isWinnersAnnounced}
                          className={cn(
                            'text-lg font-semibold text-slate-700 md:text-xl',
                          )}
                          style={{
                            width: widthOfPrize,
                          }}
                          showUsdSymbol={showUsdSymbolOnly}
                        />
                        <p className="text-lg font-normal text-slate-500">
                          {isProject ? 'Payment' : 'Total Prizes'}
                        </p>
                      </div>
                    </td>
                  </tr>

                  {!isProject && rewards && (
                    <tr>
                      <td className="p-0" colSpan={3}>
                        <PrizesList
                          widthPrize={widthOfPrize}
                          totalReward={rewardAmount ?? 0}
                          maxBonusSpots={maxBonusSpots ?? 0}
                          token={!showUsdSymbolOnly ? token || '' : 'USD'}
                          rewards={rewards}
                          showUsdSymbol={showUsdSymbolOnly}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="w-full border-b border-slate-100" />
          <div
            className={cn(
              'flex w-full justify-between',
              rewards ? 'py-0' : 'py-3',
            )}
          >
            {hasHackathonStarted ? (
              <>
                <div className="flex flex-col items-start justify-center">
                  <div className="flex items-center justify-center gap-2">
                    <TbBriefcase2
                      className={cn(
                        isPro ? 'text-zinc-900' : 'text-brand-purple',
                        'size-[1.4rem]',
                      )}
                    />
                    <p className="text-lg font-medium text-black md:text-xl">
                      {isSubmissionNumberLoading
                        ? '...'
                        : !isProject
                          ? submissionNumber?.toLocaleString('en-us')
                          : submissionRange}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    {isProject
                      ? 'Applications'
                      : submissionNumber === 1
                        ? 'SUBMISSION'
                        : 'SUBMISSIONS'}
                  </p>
                </div>

                <div className="flex flex-col items-start justify-center py-3">
                  <div className="flex items-start justify-center gap-1">
                    <MdTimer
                      className={cn(
                        isPro ? 'text-zinc-900' : 'text-brand-purple',
                        'mt-0.5 size-[1.4rem]',
                      )}
                    />
                    <div className="flex flex-col items-start">
                      <p className="text-lg font-medium text-black md:text-xl">
                        {isSync && deadline ? (
                          <Countdown
                            date={deadline}
                            now={serverTime}
                            renderer={CountDownRenderer}
                            zeroPadDays={1}
                          />
                        ) : (
                          <span className="text-slate-400">Syncing...</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 sm:text-sm">REMAINING</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-start justify-center py-3">
                <div className="flex items-start justify-center gap-1">
                  <MdTimer
                    className={cn(
                      isPro ? 'text-zinc-900' : 'text-brand-purple',
                      'mt-0.5 size-[1.4rem]',
                    )}
                  />
                  <div className="flex flex-col items-start">
                    <p className="text-lg font-medium text-black md:text-xl">
                      {isSync && Hackathon?.startDate ? (
                        <Countdown
                          date={Hackathon.startDate}
                          now={serverTime}
                          renderer={CountDownRenderer}
                          zeroPadDays={1}
                        />
                      ) : (
                        <span className="text-slate-400">Syncing...</span>
                      )}
                    </p>
                    <p className="text-slate-400">Until Submissions Open</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="hidden w-full md:flex">
            <SubmissionActionButton listing={listing} isTemplate={isTemplate} />
          </div>
          {inReview && listing.commitmentDate && (
            <div className="mt-2 hidden w-full items-start gap-2 text-center text-sm font-medium text-gray-500 md:inline">
              Winner announcement by{' '}
              {(() => {
                const d = dayjs(listing.commitmentDate);
                const day = d.date();
                const suffix = getOrdinalSuffix(day);
                const month = d.format('MMM');
                return (
                  <span className="inline font-bold text-gray-600">
                    {day}
                    <sup className="relative top-px align-super text-[10px]">
                      {suffix}
                    </sup>{' '}
                    {month}
                  </span>
                );
              })()}
              <br />
              (as scheduled by the sponsor)
            </div>
          )}
          <div className="w-full">
            {listing.isWinnersAnnounced &&
              listing.isFndnPaying &&
              dayjs(listing.winnersAnnouncedAt).isAfter(
                dayjs.utc('2025-08-06'),
              ) && <ApprovalStages listing={listing} />}
          </div>
          {isProject && deadline && dayjs(deadline).isAfter(new Date()) && (
            <div className="mb-4 flex w-full gap-2 bg-[#62F6FF10] p-3">
              <TriangleAlert color="#1A7F86" />
              <p className="text-xs font-medium text-[#1A7F86]" color="#1A7F86">
                Don&apos;t start working just yet! Apply first, and then begin
                working only once you&apos;ve been hired for the project.
              </p>
            </div>
          )}
          <div className="mt-4 w-full">
            <ExtraInfoSection
              skills={skills}
              region={listing.region}
              requirements={listing.requirements}
              pocSocials={listing.pocSocials}
              commitmentDate={listing.commitmentDate}
              Hackathon={listing.Hackathon}
              hideWinnerAnnouncement={inReview}
              isFndnPaying={listing.isFndnPaying}
            />
          </div>
          <div className="hidden w-full py-8 text-sm md:block">
            {listing.id && (
              <RelatedListings
                isHackathon={!!listing.hackathonId}
                listingId={listing.id}
                excludeIds={listing.id ? [listing.id] : undefined}
                exclusiveSponsorId={
                  Object.values(exclusiveSponsorData).some(
                    (sponsor) => sponsor.title === listing?.sponsor?.name,
                  )
                    ? listing?.sponsorId
                    : undefined
                }
              >
                <div className="flex w-full items-center justify-between">
                  <p className="text-sm font-semibold text-slate-600">
                    {!Hackathon
                      ? 'RELATED LIVE LISTINGS'
                      : 'RELATED LIVE TRACKS'}
                  </p>
                </div>
              </RelatedListings>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

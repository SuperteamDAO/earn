import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';

import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useMediaQuery } from '@/hooks/use-media-query';
import { type SubmissionWithUser } from '@/interface/submission';
import { cn } from '@/utils/cn';
import { nthLabelGenerator } from '@/utils/rank';
import { tweetEmbedLink } from '@/utils/socialEmbeds';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import { formatTotalPrize } from '@/features/listing-builder/utils/formatTotalPrize';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { listingWinnersQuery } from '../../queries/listing-winners';
import type { Listing, Rewards } from '../../types';
import { tweetTemplate } from '../../utils/tweetTemplate';

interface Props {
  bounty: Listing;
}

const getOrRemoveBonuses = (
  submissions: SubmissionWithUser[],
  removeBonus: boolean,
) => {
  if (removeBonus)
    return submissions.filter(
      (s) => s.winnerPosition !== BONUS_REWARD_POSITION,
    );
  else
    return submissions.filter(
      (s) => s.winnerPosition === BONUS_REWARD_POSITION,
    );
};

export function ListingWinners({ bounty }: Props) {
  const isProject = bounty?.type === 'project';

  const posthog = usePostHog();
  const isMD = useMediaQuery('(min-width: 768px)');

  const { data: submissions = [], isLoading } = useQuery(
    listingWinnersQuery(bounty?.id),
  );

  const openWinnerLink = () => {
    let path = window.location.href.split('?')[0];
    if (!path) return;
    path += 'winner/';

    return tweetEmbedLink(tweetTemplate(path));
  };

  if (isLoading || !submissions.length) {
    return null;
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl rounded-lg bg-brand-purple/10 px-4 pt-4">
      <div className="flex justify-between gap-2">
        <p className="mx-3 font-semibold text-slate-500 md:text-xl">
          🎉 Winners
        </p>
        <Link href={openWinnerLink() ?? '#'} target="_blank">
          <Button
            className={cn(
              'ph-no-capture flex h-min gap-2',
              'px-2 py-1.5 md:px-3 md:py-2',
              'text-sm font-medium md:text-base',
              'text-[rgba(0,0,0,0.65)]',
              'border-slate-300 bg-white',
              'hover:bg-white/80 active:bg-white/50',
            )}
            onClick={() => posthog.capture('click to tweet_listing')}
            variant="outline"
          >
            <div className="flex h-min w-[0.9rem] items-center md:w-[1.1rem]">
              <svg
                width="33"
                viewBox="0 0 33 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M25.0851 3.09375H29.6355L19.6968 14.4504L31.3886 29.9062H22.2363L15.0626 20.5348L6.86421 29.9062H2.30737L12.9357 17.7568L1.72729 3.09375H11.1117L17.5892 11.6596L25.0851 3.09375ZM23.4867 27.1863H26.0068L9.73882 5.67188H7.03179L23.4867 27.1863Z"
                  fill="black"
                />
              </svg>
            </div>
            Share
          </Button>
        </Link>
      </div>
      <div className="mx-3 mt-2 md:mt-0">
        <div className="w-full rounded-md px-3 py-4 md:px-4">
          <div className="flex flex-wrap items-center justify-center gap-10">
            {getOrRemoveBonuses(submissions, true)
              .slice(0, 3)
              .map((submission) => (
                <Link
                  key={submission.id}
                  href={
                    !isProject
                      ? `/feed/submission/${submission?.id}`
                      : `/t/${submission?.user?.username}`
                  }
                  passHref
                  className="flex cursor-pointer flex-col items-center justify-center"
                >
                  <div className="relative">
                    {!isProject && (
                      <div
                        className={cn(
                          'absolute bottom-[-12px] left-1/2 -translate-x-1/2',
                          'flex items-center justify-center',
                          'h-6 w-6 px-1',
                          'text-center text-[10px] font-semibold capitalize',
                          'rounded-full bg-white text-slate-500',
                        )}
                      >
                        {nthLabelGenerator(submission?.winnerPosition ?? 0)}
                      </div>
                    )}
                    <EarnAvatar
                      size={isMD ? '64px' : '52px'}
                      id={submission?.user?.id}
                      avatar={submission?.user?.photo as string}
                    />
                  </div>
                  <p className="line-clamp-2 w-min pt-4 text-center text-xs font-semibold text-slate-700 md:w-auto md:text-sm">{`${submission?.user?.firstName} ${submission?.user?.lastName}`}</p>
                  <p className="text-center text-xs font-normal text-slate-500 opacity-60">
                    {bounty?.rewards &&
                      formatTotalPrize(
                        bounty?.rewards[
                          Number(submission?.winnerPosition) as keyof Rewards
                        ] ?? 0,
                      )}{' '}
                    {bounty?.token}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      </div>
      {(getOrRemoveBonuses(submissions, true).length > 3 ||
        getOrRemoveBonuses(submissions, false).length > 0) && (
        <div className="wrap flex justify-center gap-2 border-t border-violet-200 px-2 py-3">
          {[
            ...getOrRemoveBonuses(submissions, true).slice(3),
            ...getOrRemoveBonuses(submissions, false),
          ].map((submission) => (
            <div key={submission.id}>
              <Tooltip content={<p>{submission?.user?.firstName}</p>}>
                <Link
                  key={submission.id}
                  href={
                    !isProject
                      ? `/feed/submission/${submission?.id}`
                      : `/t/${submission?.user?.username}`
                  }
                  className="inline-block"
                >
                  <EarnAvatar
                    size={isMD ? '44px' : '36px'}
                    id={submission?.user?.id}
                    avatar={submission?.user?.photo as string}
                  />
                </Link>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

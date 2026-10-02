import { ExternalImage } from '@/components/ui/cloudinary-image';
import { TokenIcon } from '@/components/ui/token-icon';
import { type ListingRewardType } from '@/prisma/enums';
import { getRankLabels } from '@/utils/rank';

import { getInKindRewardQuantityLabel } from '@/features/listings/components/InKindRewardDisplay';
import {
  type InKindRewardMetadata,
  type Rewards,
} from '@/features/listings/types';

export const WinnerFeedImage = ({
  token,
  rewardType,
  inKindReward,
  winnerPosition,
  rewards,
  grantApplicationAmount,
}: {
  rewardType?: ListingRewardType;
  token: string | null | undefined;
  inKindReward?: InKindRewardMetadata | null;
  winnerPosition: keyof Rewards | undefined;
  rewards: Rewards | undefined;
  grantApplicationAmount?: number;
}) => {
  const quantity = winnerPosition
    ? (rewards?.[Number(winnerPosition)] ?? 0)
    : 0;
  const isInKindReward = rewardType === 'IN_KIND' && !!inKindReward;

  return (
    <div className="flex h-[200px] w-full flex-col justify-center rounded-t-md border bg-[#7E51FF] md:h-[350px]">
      <ExternalImage
        className="mx-auto h-9 w-9 md:h-20 md:w-20"
        alt="winner"
        src={'/icons/celebration.png'}
      />
      <div className="mt-4 flex w-full items-center justify-center gap-1 md:gap-4">
        {isInKindReward ? (
          <span className="flex size-10 items-center justify-center rounded-lg bg-white p-2 md:size-18">
            <img
              className="size-full object-contain"
              alt=""
              src={inKindReward.icon}
              aria-hidden="true"
            />
          </span>
        ) : (
          <TokenIcon
            className="h-8 w-8 md:h-16 md:w-16"
            alt={`${token} icon`}
            symbol={token}
          />
        )}
        <p className="text-2xl font-semibold text-white md:text-5xl">
          {grantApplicationAmount ? (
            grantApplicationAmount
          ) : isInKindReward ? (
            <>
              {quantity} ×{' '}
              {getInKindRewardQuantityLabel(quantity, inKindReward)}
            </>
          ) : (
            <>{winnerPosition ? quantity : 'N/A'}</>
          )}{' '}
          {!isInKindReward && token}
        </p>
      </div>
      <p className="mx-auto my-4 w-fit rounded-full bg-[#5536ab8a] px-4 py-2 text-xs font-medium text-white md:text-lg">
        {grantApplicationAmount ? (
          'GRANT'
        ) : (
          <>{getRankLabels(Number(winnerPosition))?.toUpperCase()} PRIZE</>
        )}
      </p>
    </div>
  );
};

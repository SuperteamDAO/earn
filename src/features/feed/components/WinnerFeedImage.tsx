import { tokenList } from '@/constants';
import { type Rewards } from '@/features/listings';
import { getRankLabels } from '@/utils/rank';

export const WinnerFeedImage = ({
  token,
  winnerPosition,
  rewards,
  grantApplicationAmount,
}: {
  token: string | undefined;
  winnerPosition: keyof Rewards | undefined;
  rewards: Rewards | undefined;
  grantApplicationAmount?: number;
}) => {
  return (
    <div className="flex h-[200px] w-full flex-col justify-center rounded-md rounded-t-lg border-t-2 bg-[#7E51FF] md:h-[350px]">
      <img
        className="mx-auto h-9 w-9 md:h-20 md:w-20"
        alt="winner"
        src={'/assets/icons/celebration.png'}
      />
      <div className="mt-4 flex w-full flex-col items-center justify-center gap-1 md:gap-4">
        <img
          className="h-8 w-8 md:h-16 md:w-16"
          alt={`${token} icon`}
          src={tokenList.find((t) => t.tokenSymbol === token)?.icon || ''}
        />
        <p className="text-2xl font-semibold text-white md:text-5xl">
          {!!grantApplicationAmount ? (
            grantApplicationAmount
          ) : (
            <>
              {winnerPosition ? `${rewards?.[Number(winnerPosition)]}` : 'N/A'}
            </>
          )}{' '}
          {token}
        </p>
      </div>
      <p className="mx-auto my-4 w-fit rounded-full bg-[#5536ab8a] px-4 py-2 text-xs font-medium text-white md:text-lg">
        {!!grantApplicationAmount ? (
          'GRANT'
        ) : (
          <>{getRankLabels(Number(winnerPosition))?.toUpperCase()} PRIZE</>
        )}
      </p>
    </div>
  );
};

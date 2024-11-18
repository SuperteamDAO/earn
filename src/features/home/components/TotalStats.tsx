import { Skeleton } from '@/components/ui/skeleton';

export const TotalStats = ({
  bountyCount,
  TVE,
  isTotalLoading,
}: {
  bountyCount: number | undefined;
  TVE: number | undefined;
  isTotalLoading: boolean;
}) => {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md bg-[#F8FAFC] px-2 py-4">
      <div className="flex">
        <img
          className="mb-auto mr-2 h-[1.5625rem]"
          alt=""
          src="/assets/icons/lite-purple-dollar.svg"
        />
        <div>
          {isTotalLoading ? (
            <Skeleton className="h-3.5 w-[54px]" />
          ) : (
            <p className="text-sm font-semibold text-black">
              ${TVE?.toLocaleString('en-us')}
            </p>
          )}
          <p className="text-xs font-normal text-gray-500">
            Total Value Earned
          </p>
        </div>
      </div>
      <div className="hidden h-[80%] w-[0.0625rem] bg-[#CBD5E1] xl:block" />
      <div className="flex">
        <img
          className="mb-auto mr-2 h-[25px]"
          alt="suitcase"
          src="/assets/icons/lite-purple-suitcase.svg"
        />
        <div>
          {isTotalLoading ? (
            <Skeleton className="h-3.5 w-[32px]" />
          ) : (
            <p className="text-sm font-semibold text-black">{bountyCount}</p>
          )}
          <p className="text-xs font-normal text-gray-500">
            Opportunities Listed
          </p>
        </div>
      </div>
    </div>
  );
};

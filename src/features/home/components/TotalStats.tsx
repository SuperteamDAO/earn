import { ExternalImage } from '@/components/ui/cloudinary-image';
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
    <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-4">
      <div className="flex">
        <ExternalImage
          className="mr-2 mb-auto h-[1.5625rem]"
          alt=""
          src={'/icons/lite-purple-dollar.svg'}
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
      <div className="hidden h-[80%] w-[0.0625rem] bg-slate-300 xl:block" />
      <div className="flex">
        <ExternalImage
          className="mr-2 mb-auto h-[25px]"
          alt="suitcase"
          src={'/icons/lite-purple-suitcase.svg'}
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

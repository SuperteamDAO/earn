import { Pencil } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useUser } from '@/store/user';

import { getListingIcon } from '../utils/getListingIcon';

interface AddListingCardProps {
  listingType?: 'bounty' | 'project' | 'grant';
}

export const AddListingCard = ({
  listingType = 'bounty',
}: AddListingCardProps) => {
  const { user } = useUser();
  const displayType =
    listingType.charAt(0).toUpperCase() + listingType.slice(1);
  const createUrl = '/dashboard/listings?open=1';
  const sponsorName = user?.currentSponsor?.name || 'Your Company Name';
  const sponsorSlug = user?.currentSponsor?.slug;

  return (
    <Link
      href={createUrl}
      className="group block w-full rounded-md px-2 py-4 no-underline hover:bg-gray-100 sm:px-4"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex w-full">
          <div className="mr-5 h-16 w-18 rounded-md bg-slate-100 transition group-hover:bg-slate-50">
            <div className="flex h-full w-full items-center justify-center">
              <Pencil className="h-6 w-6 text-gray-600" strokeWidth={2} />
            </div>
          </div>

          <div className="flex w-full flex-col justify-between">
            <p className="line-clamp-1 text-sm font-semibold text-slate-700 sm:text-base">
              Your {displayType} Here
            </p>
            {sponsorSlug ? (
              <Link
                href={`/s/${sponsorSlug}`}
                onClick={(e) => e.stopPropagation()}
                className="flex w-min items-center gap-1 hover:underline"
              >
                <p className="text-xs whitespace-nowrap text-slate-500 md:text-sm">
                  {sponsorName}
                </p>
              </Link>
            ) : (
              <p className="text-xs whitespace-nowrap text-slate-500 md:text-sm">
                {sponsorName}
              </p>
            )}
            <div className="mt-[1px] flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1">
                {getListingIcon(listingType)}
                <p className="hidden text-xs font-medium text-gray-500 sm:flex">
                  {displayType}
                </p>
              </div>
              <p className="text-[10px] text-slate-300 sm:text-xs md:text-sm">
                |
              </p>
              <div className="flex items-center gap-1">
                <p className="text-[10px] whitespace-nowrap text-gray-500 sm:text-xs">
                  Closes in XYZ Days
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-start">
          <Button
            variant="outline"
            size="sm"
            className="pointer-events-none text-slate-700 drop-shadow-sm"
          >
            Create {displayType}
          </Button>
        </div>
      </div>
    </Link>
  );
};

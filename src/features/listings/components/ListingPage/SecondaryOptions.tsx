import { EllipsisVertical } from 'lucide-react';
import * as React from 'react';
import { IoMdShareAlt } from 'react-icons/io';
import { RiFlagFill } from 'react-icons/ri';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { type Listing } from '../../types';
import { ShareListing } from './ShareListing';

export function SecondaryOptions({
  listing,
}: {
  listing: Listing | undefined;
}) {
  const [shareOpen, setShareOpen] = React.useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="h-8 w-auto rounded-md p-0 px-2 hover:bg-slate-100 focus-visible:outline-0 sm:h-10 sm:px-2">
          <EllipsisVertical className="text-slate-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[6rem] p-0" align="end">
          <DropdownMenuItem
            onSelect={() => setShareOpen(true)}
            className="group flex cursor-pointer justify-center font-medium text-slate-500"
          >
            <IoMdShareAlt className="group-hover:text-accent-foreground !size-5 text-slate-500" />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator className="m-0" />
          <DropdownMenuItem className="flex cursor-pointer justify-center font-medium text-slate-500 focus:text-red-500">
            <RiFlagFill />
            Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ShareListing
        source="listing"
        listing={listing}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </>
  );
}

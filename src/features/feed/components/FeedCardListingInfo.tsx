import Link from 'next/link';

import { Avatar, AvatarImage } from '@/components/ui/avatar';

interface FeedCardListingInfoProps {
  sponsorSlug?: string;
  sponsorLogo?: string;
  listingLink: string;
  listingTitle?: string;
  // While the card's "View ..." link is hovered, the title drops its
  // group-hover underline so only one link reads as active.
  isViewLinkHovered: boolean;
}

export function FeedCardListingInfo({
  sponsorSlug,
  sponsorLogo,
  listingLink,
  listingTitle,
  isViewLinkHovered,
}: FeedCardListingInfoProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-3">
      {sponsorSlug ? (
        <Link
          href={`/earn/s/${sponsorSlug}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Avatar className="size-5 sm:size-7">
            <AvatarImage src={sponsorLogo} alt="Sponsor Logo" />
          </Avatar>
        </Link>
      ) : (
        <Avatar className="size-5 sm:size-7">
          <AvatarImage src={sponsorLogo} alt="Sponsor Logo" />
        </Avatar>
      )}
      <Link
        className={`text-xs font-semibold text-gray-500 sm:text-sm md:text-base ${isViewLinkHovered ? '' : 'group-hover:underline'} line-clamp-1 group-hover:decoration-current`}
        href={listingLink}
        rel="noopener noreferrer"
        target="_blank"
      >
        {listingTitle}
      </Link>
    </div>
  );
}

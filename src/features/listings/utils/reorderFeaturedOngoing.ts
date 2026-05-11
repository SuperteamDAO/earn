interface MinimalListing {
  readonly isFeatured: boolean | null;
  readonly isWinnersAnnounced: boolean;
  readonly deadline: Date | null;
}

const MAX_FEATURED_LISTINGS = 2;

function isOngoingListing(listing: MinimalListing): boolean {
  if (listing.isWinnersAnnounced === true) {
    return false;
  }

  if (!listing.deadline) {
    return true;
  }

  const now = new Date();
  const deadline = new Date(listing.deadline);
  return deadline >= now;
}

function getDeadlineTime(listing: MinimalListing): number {
  if (!listing.deadline) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(listing.deadline).getTime();
}

export function reorderFeaturedOngoing<T extends MinimalListing>(
  listings: T[],
): T[] {
  const promotedFeatured = listings
    .filter(
      (listing) => listing.isFeatured === true && isOngoingListing(listing),
    )
    .sort((a, b) => getDeadlineTime(a) - getDeadlineTime(b))
    .slice(0, MAX_FEATURED_LISTINGS);

  const promotedFeaturedSet = new Set(promotedFeatured);

  const others = listings
    .filter((listing) => !promotedFeaturedSet.has(listing))
    .map((listing) => {
      if (listing.isFeatured === true && isOngoingListing(listing)) {
        return { ...listing, isFeatured: false } as T;
      }

      return listing;
    })
    .sort((a, b) => getDeadlineTime(a) - getDeadlineTime(b));

  return [...promotedFeatured, ...others];
}

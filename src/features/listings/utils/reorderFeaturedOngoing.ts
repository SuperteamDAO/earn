interface MinimalListing {
  readonly isFeatured: boolean | null;
  readonly isWinnersAnnounced: boolean;
  readonly deadline: Date | null;
}

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

export function reorderFeaturedOngoing<T extends MinimalListing>(
  listings: T[],
): T[] {
  const featuredOngoing: T[] = [];
  const others: T[] = [];

  for (const listing of listings) {
    if (listing.isFeatured === true && isOngoingListing(listing)) {
      featuredOngoing.push(listing);
    } else {
      others.push(listing);
    }
  }

  return [...featuredOngoing, ...others];
}

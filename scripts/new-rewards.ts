/* eslint-disable */
// @ts-nocheck

import { prisma } from '@/prisma';

const BATCH_SIZE = 500;

const rewriteListings = async () => {
  console.log('start');
  let processedCount = 0;
  let hasMore = true;

  while (hasMore) {
    console.log('start-2');
    const listings = await prisma.bounties.findMany({
      take: BATCH_SIZE,
      skip: processedCount,
      select: {
        rewards: true,
        id: true,
        Submission: {
          select: {
            id: true,
            winnerPosition: true,
          },
        },
      },
    });

    console.log('listings', listings);

    if (listings.length === 0) {
      hasMore = false;
      break;
    }

    for (const listing of listings) {
      if (listing.rewards) {
        const oldRewards = listing.rewards as { [key: string]: number };
        const newRewards: { [rank: number]: number } = {};
        const rankMap: { [key: string]: number } = {
          first: 1,
          second: 2,
          third: 3,
          fourth: 4,
          fifth: 5,
        };

        for (const [key, value] of Object.entries(oldRewards)) {
          if (rankMap[key] && typeof value === 'number') {
            newRewards[rankMap[key]!] = value;
          }
        }

        await prisma.bounties.update({
          where: { id: listing.id },
          data: { rewards: newRewards },
        });

        // Update related submissions
        for (const submission of listing.Submission) {
          if (submission.winnerPosition !== null) {
            const oldPosition = submission.winnerPosition;
            let newPosition: string | null = null;

            if (oldPosition !== '') {
              const mappedPosition = rankMap[oldPosition];
              if (mappedPosition !== undefined) {
                newPosition = mappedPosition.toString();
              } else if (!isNaN(Number(oldPosition))) {
                newPosition = oldPosition;
              }
            }

            await prisma.submission.update({
              where: { id: submission.id },
              data: { winnerPosition: newPosition },
            });
          }
        }
      }
    }

    processedCount += listings.length;
    console.log(`Processed ${processedCount} listings`);
  }

  console.log(`Finished processing all listings`);
};

await rewriteListings().catch(console.error);

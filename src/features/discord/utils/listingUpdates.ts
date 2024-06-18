import { type Prisma } from '@prisma/client';
import { WebhookClient } from 'discord.js';

import { DISCORD_LISTINGS_WEBHOOK } from '@/constants/Discord';
import { getURL } from '@/utils/validUrl';

const discord = new WebhookClient({ url: DISCORD_LISTINGS_WEBHOOK });

export type updateStatus =
  | 'Draft Added'
  | 'Published'
  | 'Unpublished'
  | 'Deadline Reached'
  | 'Winner Announced';

type BountiesWithSponsor = Prisma.BountiesGetPayload<{
  include: {
    sponsor: true;
  };
}>;

export async function discordListingUpdate(
  listing: BountiesWithSponsor,
  status: updateStatus,
) {
  const url = `${getURL()}listings/${listing.type}/${listing.slug}`;

  const msg = `Listing: ${listing.title} (${url})
Type: ${listing.type}
Sponsor Name: ${listing.sponsor.name} (${listing.sponsor?.url})
Amount: ${listing.rewardAmount} ${listing.token}
${listing.compensationType === 'variable' ? '\tVariable' : ''}
\t${
    listing.compensationType === 'range'
      ? `\t${listing.minRewardAsk} (${listing.token}) to ${listing.maxRewardAsk} (${listing.token})`
      : ''
  }
Status: ${status}
`;

  await discord.send(msg);
  console.log('Message sent');
}

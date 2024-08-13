import { type Prisma } from '@prisma/client';
import { WebhookClient } from 'discord.js';

import { getURL } from '@/utils/validUrl';

import { creatPOCLink } from '.';

type updateStatus =
  | 'Draft Added'
  | 'Published'
  | 'Unpublished'
  | 'Deadline Reached';

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

  const msg = `**${status}:**
Listing: ${listing.title} (<${url}>)
Type: ${listing.type}
Sponsor Name: ${listing.sponsor.name} (<${listing.pocSocials ? creatPOCLink(listing.pocSocials) : listing.sponsor?.url}>)
Amount: ${listing.rewardAmount ? `${listing.rewardAmount} ${listing.token}` : ''}${listing.compensationType === 'variable' ? 'Variable' : ''}${listing.compensationType === 'range' ? `${listing.minRewardAsk} ${listing.token} to ${listing.maxRewardAsk} ${listing.token}` : ''}
`;

  const discord = new WebhookClient({
    url: process.env.DISCORD_LISTINGS_WEBHOOK!,
  });

  await discord.send({
    content: msg,
    embeds: [],
  });
  console.log('Message sent');
}

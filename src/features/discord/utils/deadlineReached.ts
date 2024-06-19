import { type Prisma } from '@prisma/client';
import { WebhookClient } from 'discord.js';

import { getURL } from '@/utils/validUrl';

const discord = new WebhookClient({
  url: process.env.DISCORD_LISTINGS_WEBHOOK!,
});

type BountiesWithSponsor = Prisma.BountiesGetPayload<{
  include: {
    sponsor: true;
  };
}>;

export async function discordDeadlineReached(listings: BountiesWithSponsor[]) {
  const msgs: string[] = [];

  for (const listing of listings) {
    const url = `${getURL()}listings/${listing.type}/${listing.slug}`;

    msgs.push(`Listing: ${listing.title} (<${url}>)
Type: ${listing.type}
Sponsor Name: ${listing.sponsor.name} (<${listing.sponsor?.url}>)
${listing.rewardAmount ? `Amount: ${listing.rewardAmount} ${listing.token}` : ''}${listing.compensationType === 'variable' ? 'Variable' : ''}${listing.compensationType === 'range' ? `${listing.minRewardAsk} (${listing.token}) to ${listing.maxRewardAsk} (${listing.token})` : ''}
Status: Deadline Reached
`);
  }
  await discord.send({
    content: msgs.join('\n\n'),
    embeds: [],
  });
  console.log('Message sent');
}

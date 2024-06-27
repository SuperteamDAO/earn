import { type Prisma } from '@prisma/client';
import { WebhookClient } from 'discord.js';

import { getURL } from '@/utils/validUrl';

type BountiesWithSponsor = Prisma.BountiesGetPayload<{
  include: {
    sponsor: true;
  };
}>;

export async function discordDeadlineReached(listings: BountiesWithSponsor[]) {
  const msgs: string[] = [];
  let msg: string = '';

  let listing: BountiesWithSponsor | undefined;
  for (let i = 0; i < listings.length; i++) {
    listing = listings[i];
    if (!listing) continue;
    const url = `${getURL()}listings/${listing.type}/${listing.slug}`;

    msg += `\n**Deadline Reached:**
Listing: ${listing.title} (<${url}>)
Type: ${listing.type}
Sponsor Name: ${listing.sponsor.name} (<${listing.sponsor?.url}>)
Amount: ${listing.rewardAmount ? `${listing.rewardAmount} ${listing.token}` : ''}${listing.compensationType === 'variable' ? 'Variable' : ''}${listing.compensationType === 'range' ? `${listing.minRewardAsk} ${listing.token} to ${listing.maxRewardAsk} ${listing.token}` : ''}
`;
    if (msg.length >= 1500 || i === listings.length - 1) {
      msgs.push(msg);
      msg = '';
    }
  }

  const discord = new WebhookClient({
    url: process.env.DISCORD_LISTINGS_WEBHOOK!,
  });

  for (const msg of msgs) {
    await discord.send({
      content: msg,
      embeds: [],
    });
  }
  console.log('Message sent');
}

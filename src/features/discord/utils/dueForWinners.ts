import { type Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { WebhookClient } from 'discord.js';

import { getURL } from '@/utils/validUrl';

type BountiesWithSponsor = Prisma.BountiesGetPayload<{
  include: {
    sponsor: true;
  };
}>;

export async function discordDueForWinners(listings: BountiesWithSponsor[]) {
  const msgs: string[] = [];

  for (const listing of listings) {
    const url = `${getURL()}listings/${listing.type}/${listing.slug}`;

    msgs.push(`**Due for Winner Announcement:**
Listing: ${listing.title} (<${url}>)
Sponsor Name: ${listing.sponsor.name} (<${listing.sponsor?.url}>)
Deadline: ${dayjs(listing.deadline).format('MMMM D, YYYY')} (5 days ago)
`);
  }

  const discord = new WebhookClient({
    url: process.env.DISCORD_WINNERS_WEBHOOK!,
  });

  await discord.send({
    content: msgs.join('\n'),
    embeds: [],
  });
  console.log('Message sent');
}

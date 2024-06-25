import { type Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { WebhookClient } from 'discord.js';

import { timeAgoShort } from '@/utils/timeAgo';
import { getURL } from '@/utils/validUrl';

type BountiesWithSponsor = Prisma.BountiesGetPayload<{
  include: {
    sponsor: true;
  };
}>;

export async function discordDueForWinners(listings: BountiesWithSponsor[]) {
  const msgs: string[] = [];
  let msg: string = '';
  let listing: BountiesWithSponsor | undefined;
  for (let i = 0; i < listings.length; i++) {
    listing = listings[i];
    if (!listing) continue;
    const url = `${getURL()}listings/${listing.type}/${listing.slug}`;

    msg += `\n**Due for Winner Announcement:**
Listing: ${listing.title} (<${url}>)
Sponsor Name: ${listing.sponsor.name} (<${listing.sponsor?.url}>)
Deadline: ${dayjs(listing.deadline).format('MMMM D, YYYY')} ${listing.deadline ? `(${timeAgoShort(listing.deadline)} ago)` : ``}
`;

    if (msg.length >= 1500 || i === listings.length - 1) {
      msgs.push(msg);
      msg = '';
    }
  }
  const discord = new WebhookClient({
    url: process.env.DISCORD_WINNERS_WEBHOOK!,
  });

  for (const msg of msgs) {
    await discord.send({
      content: msg,
      embeds: [],
    });
  }
  console.log('Message sent');
}

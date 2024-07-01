import { type Prisma } from '@prisma/client';
import { WebhookClient } from 'discord.js';

import { getURL } from '@/utils/validUrl';

import { creatPOCLink } from '.';

type BountiesWithSponsor = Prisma.BountiesGetPayload<{
  include: {
    sponsor: true;
  };
}>;

export async function discordWinnersAnnouncement(listing: BountiesWithSponsor) {
  const url = `${getURL()}listings/${listing.type}/${listing.slug}`;

  const msg = `**Winners Announced:**
Listing: ${listing.title} (<${url}>)
Sponsor Name: ${listing.sponsor.name} (<${listing.pocSocials ? creatPOCLink(listing.pocSocials) : listing.sponsor?.url}>)
`;

  const discord = new WebhookClient({
    url: process.env.DISCORD_WINNERS_WEBHOOK!,
  });

  await discord.send({
    content: msg,
    embeds: [],
  });
  console.log('Message sent');
}

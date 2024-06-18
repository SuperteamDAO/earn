// import { type NextApiRequest, type NextApiResponse } from 'next';
//
// import { discord } from '@/discord';
// import { prisma } from '@/prisma';
// import { getURL } from '@/utils/validUrl';
//
// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse,
// ) {
//   console.log('checking method');
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method Not Allowed' });
//   }
//
//   console.log('initaiting discord api');
//
//   try {
//     const { id, status } = req.body as { id: string | undefined, status: string | undefined };
//     if (!id || !status) {
//       return res.status(400).send('missing listing id or status')
//     }
//
//     const listing = await prisma.bounties.findUnique({
//       where: { id },
//       include: {
//         sponsor: true
//       }
//     })
//     if (!listing) {
//       return res.status(400).send(`listing not found with id ${id}`)
//     }
//
//     const url = `${getURL()}listings/${listing.type}/${listing.slug}`
//
//     let msg = `Listing: ${listing.title} (${url})
// Type: ${listing.type}
// Sponsor Name: ${listing.sponsor.name} (${listing.sponsor.url})
// Amount: ${listing.rewardAmount} ${listing.token}
// ${listing.compensationType === 'variable' ? '\tVariable' : ''}
// \t${listing.compensationType === 'range' ?
//         `\t${listing.minRewardAsk} (${listing.token}) to ${listing.maxRewardAsk} (${listing.token})`
//         : ""}
// Status: ${status}
// `
//
//     await discord.send(msg);
//     console.log('Message sent');
//     return res.send('message sent');
//     // discord.once('ready', async () => {
//     // const guild = discord.guilds.cache.get(PRIVATE_NOTIFICATION_SERVER_ID);
//     // console.log('guguggugugild??')
//     // if (guild) {
//     //   console.log('guild found!')
//     //   const channel = guild.channels.cache.get(PRIVATE_NOTIFICATION_LISTING_CHANNEL_ID)
//     //   if (channel && channel.isTextBased()) {
//     //     console.log('channel found!!')
//     //     let sendMessage = 'yo again?'
//     //     await channel.send(sendMessage)
//     //     console.log('message sent!')
//     //     res.send('message sent')
//     //   } else {
//     //     console.log('message sent')
//     //     res.status(404).send('message sent')
//     //   }
//     // } else {
//     //   console.log('guild not found')
//     //   res.status(404).send('guild not found')
//     // }
//     // })
//   } catch (err) {
//     console.log('Error occured in discord');
//     console.log(err);
//     return res.status(400).send(err);
//   }
// }

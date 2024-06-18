import { WebhookClient } from 'discord.js';

import { PRIVATE_NOTIFICATION_WEBHOOK } from '@/constants/Discord';

// const discord = new Client({
//   intents: [
//     GatewayIntentBits.Guilds,
//     GatewayIntentBits.GuildMessages
//   ],
// })

const discord = new WebhookClient({ url: PRIVATE_NOTIFICATION_WEBHOOK });
// discord.send('Hello, this is a message sent through a webhook!')
//   .then(() => console.log('Message sent successfully'))
//   .catch(console.error);

// discord.once('ready', async () => {
//   console.log(`⚡ Logged in as ${discord.user?.username ?? 'unknown'}`);
//
//   try {
//     const guild = discord.guilds.cache.get(PRIVATE_NOTIFICATION_SERVER_ID);
//     console.log('guguggugugild??')
//     if (guild) {
//       console.log('guild found!')
//       const channel = guild.channels.cache.get(PRIVATE_NOTIFICATION_LISTING_CHANNEL_ID)
//       if (channel && channel.isTextBased()) {
//         console.log('channel found!!')
//         let sendMessage = 'yo once'
//         await channel.send(sendMessage)
//         console.log('message sent!')
//       } else {
//         console.log('message sent')
//       }
//     } else {
//       console.log('guild not found')
//     }
//   } catch (err) {
//     console.log('Error occured in discord')
//     console.log(err)
//   }
//
// })

// discord.login(process.env.DISCORD_TOKEN)

export { discord };

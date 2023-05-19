import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { title } = req.body;
  try {
    const result = await prisma.bounties.create({
      data: {
        title: title ?? 'Mochi Raycast Extension Development Bounty',
        slug: 'mochi-raycast-extension-development-bounty',
        description:
          '<h1>About the Bounty</h1><p>Mochi is a platform that allows Discord server owners to integrate trading supporting tools called Mochi APIs. Mochi APIs now provide Token and NFT Data query: User can query Token price, marketcap, and movement; NFT rarity and raking and sales which support the investment decision.</p><p>Superteam is sponsoring a bounty for developers to use Mochi APIs to build a Raycast extension, which meets the following requirement: Users should be able to use the Raycast extension to query the token price, info and movement; convert token; and NFT rarity, ranking and sales.</p><p>&nbsp;</p><h3><a href="https://airtable.com/shrBJiFfhKzKYPvlm" target="_blank">Send Us Your Bounty Submission</a></h3><p>&nbsp;</p><p><strong><em>Your Mission</em></strong><em>: Develop a Raycast extension that fulfils the above criteria, using MochiPay&rsquo;s APIs. You can participate in teams of up to three people.&nbsp;</em></p><p>&nbsp;</p><h2>Rewards</h2><p>🥇 First Prize</p><ul><li>$500 USDC</li><li>Member status in Superteam</li></ul><p>&nbsp;</p><p><strong>🥈 Second Prize</strong></p><ul><li>$300 USDC</li><li>Member status in Superteam</li></ul><p>&nbsp;</p><p><strong>🥉 Third Prize</strong></p><ul><li>$200 USDC</li><li>Member status in Superteam</li></ul><p>&nbsp;</p><h2>Evaluation Criteria</h2><p><strong>General Criteria</strong></p><ul><li>Ease of use of the extension (ie should have a good UX)</li><li><a href="https://developers.raycast.com/basics/create-your-first-extension" target="_blank"><strong>Should use Raycast&rsquo;s built-in extension bootstrapping tool to make the evaluation process easier</strong></a></li><li>The number of commands shouldn&rsquo;t be too much (<strong>4 is ideal</strong>), we want to focus on quality over quantity</li><li>README Inclusions</li><li class="ql-indent-1">A comprehensive README, incl. a clear description of the work and how Mochi APIs are being used in the &ldquo;Technologies Used&rdquo; section of the README</li><li class="ql-indent-1">Please mention the team members&rsquo; information (GitHub handle, email)</li><li class="ql-indent-1">Please include a link to the working demo or a testing guide</li><li class="ql-indent-1">Include 3-5 suggested use cases for the extension</li></ul><p>&nbsp;</p><p>&nbsp;</p><p><strong>Submission Requirements</strong></p><ul><li>Was your Github repo accessible by the reviewing team at the time of submission? Please make sure that the submitted Github link is accessible or shared with <a href="mailto:gm@mochi.gg" target="_blank"><strong>gm@mochi.gg</strong></a></li><li>A comprehensive README with all the things mentioned above</li><li>Note that the winning projects will <strong>need to be open-sourced once chosen</strong></li><li>Only submit what you have built specifically for this bounty</li><li>Did you submit before the deadline? Note: there will be no deadline extensions.</li></ul><p>&nbsp;</p><h2>Resources</h2><ul><li>Mochi API</li><li class="ql-indent-1"><a href="https://api.mochi.pod.town/api/v1/defi/tokens" target="_blank">https://api.mochi.pod.town/api/v1/defi/tokens</a></li><li class="ql-indent-1"><a href="https://api.mochi.pod.town/api/v1/defi/market-chart" target="_blank">https://api.mochi.pod.town/api/v1/defi/market-chart</a></li><li class="ql-indent-1"><a href="https://api.mochi.pod.town/api/v1/defi/market-data" target="_blank">https://api.mochi.pod.town/api/v1/defi/market-data</a></li><li class="ql-indent-1"><a href="https://api.mochi.pod.town/api/v1/defi/coins/:id" target="_blank">https://api.mochi.pod.town/api/v1/defi/coins/:id</a></li><li>Mochi Document (<strong>Please read section Mochi APIs which includes Crypto management and NFT thoroughly</strong>): <a href="https://mochibot.gitbook.io/mochi-bot/introduction/about-mochi-bot" target="_blank">Instruction</a></li><li>Mochi Installment: <a href="https://mochi.gg/add" target="_blank">Install Mochi Bot</a></li><li>Mochi website: <a href="https://mochi.gg/" target="_blank">Mochi.gg</a></li><li>For any questions, please DM @minh.cloud#2280 / @hollow#3333 on Discord, or @vincentzepanda / @minh_cloud on Twitter</li></ul><p>&nbsp;</p><p><em>Deadline: May 5, 2023; 11:59 PM (Indian Standard Time)</em></p><p>&nbsp;</p><p><em>Participation in this bounty is entirely voluntary. Bounties are a way to learn and dabble in opportunities to build in web3. These are neither full-time jobs nor project-based engagements. Please be advised that the sponsors will not have time for individualized feedback due to the number of entries we receive. Please check out </em><a href="https://www.notion.so/Superteam-Terms-of-Engagement-8a49d6b0239f4ecd8f40766abae44f64" target="_blank"><em>Superteam Terms of Engagement</em></a><em>.</em></p>',
        deadline: '2023-05-05T08:13:01.721Z',
        isPublished: true,
        token: 'USDC',
        rewardAmount: 1000,
        rewards: {
          first: 500,
          second: 300,
          third: 200,
        },
        sponsorId: '586c88c5-29b7-4598-bccd-c8d2f3456178',
        pocId: 'ab15dd8c-fad7-4c74-880b-6b334f8d2a39',
      },
    });
    res.status(200).json(result);
  } catch (error) {
    console.log('file: create.ts:31 ~ user ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new bountry.',
    });
  }
}

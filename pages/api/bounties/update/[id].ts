import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function bounty(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const id = params.id as string;
  const data = req.body;
  try {
    const result = await prisma.bounties.update({
      where: {
        id,
      },
      data,
    });
    res.status(200).json(result);
    const zapierWebhookUrl =
      'https://hooks.zapier.com/hooks/catch/11122522/31vi5g7/';
    await axios.post(zapierWebhookUrl, result);
  } catch (error) {
    console.log('file: update.ts:21 ~ error:', error);
    res.status(400).json({
      error,
      message: `Error occurred while updating bounty with id=${id}.`,
    });
  }
}

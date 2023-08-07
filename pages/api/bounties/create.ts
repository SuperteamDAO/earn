import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function bounty(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const data = req.body;
  console.log('file: create.ts:10 ~ data:', data);
  try {
    const result = await prisma.bounties.create({
      data,
    });
    res.status(200).json(result);
    const zapierWebhookUrl =
      'https://hooks.zapier.com/hooks/catch/11122522/31vi5g7/';
    await axios.post(zapierWebhookUrl, result);
  } catch (error) {
    console.log('file: create.ts:31 ~ user ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}

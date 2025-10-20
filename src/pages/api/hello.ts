import type { NextApiRequest, NextApiResponse } from 'next';

import { createTranche } from '@/features/grants/utils/createTranche';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  await createTranche({
    isFirstTranche: true,
    applicationId: '0a7bba36-c14d-4961-a648-9df916f87ffb',
  });
  res.status(200).json({ message: "don't buy crypto, earn it" });
}

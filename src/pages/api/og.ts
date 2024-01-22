import type { NextApiRequest, NextApiResponse } from 'next';
import { unfurl } from 'unfurl.js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { url } = req.body;

  try {
    const result = await unfurl(url);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).send(null);
  }
}

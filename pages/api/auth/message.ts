import { utils } from '@project-serum/anchor';
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';

export async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!process.env.SECRET) return res.json({ message: 'No secret' });
    const nonce = req.headers['x-nonce-token'] as string;
    const hash = nonce + process.env.SECRET.slice(0, 13);
    const check = utils.sha256.hash(hash);
    return NextResponse.json({
      hash: check,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      message: 'Something went wrong',
    });
  }
}

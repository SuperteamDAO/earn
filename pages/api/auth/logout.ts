import { deleteCookie } from 'cookies-next';
import type { NextApiRequest, NextApiResponse } from 'next';

export async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    deleteCookie('authToken', {
      res,
    });
    return res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.log(error);
    return res.json({
      message: 'Something went wrong',
    });
  }
}

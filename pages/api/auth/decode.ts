import { getCookie } from 'cookies-next';
import type { NextApiRequest, NextApiResponse } from 'next';

import { decodeToken } from '@/utils/auth/decodeToken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const authCookie = getCookie('authToken', { res, req });
    if (!authCookie) {
      return res.status(400).send({
        data: null,
        error: 'No auth token found',
      });
    }
    const decodedToken = await decodeToken(authCookie);
    if (!decodedToken) {
      return res.status(400).send({
        data: null,
        error: 'Invalid Token found',
      });
    }

    return res.status(200).send({
      data: decodedToken,
      error: null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Internal Server Error' });
  }
}

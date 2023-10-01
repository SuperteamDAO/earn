import { deleteCookie, getCookie } from 'cookies-next';
import type { NextApiRequest, NextApiResponse } from 'next';

import type { AuthCheckReturn } from '@/interface/auth';
import { prisma } from '@/prisma';
import { decodeToken } from '@/utils/auth/decodeToken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { wallet } = req.body;
    const authCookie = getCookie('authToken', {
      res,
      req,
    });

    if (!authCookie) {
      const user = await prisma.user.findFirst({
        where: {
          publicKey: wallet as string,
        },
      });
      // no user
      if (!user) {
        const returnData: AuthCheckReturn = {
          data: {
            user: null,
            type: 'NEW_WALLET',
          },
          error: null,
        };

        return res.status(200).send(returnData);
      }
      const returnData: AuthCheckReturn = {
        data: {
          user: null,
          type: 'EXISTING_USER',
        },
        error: null,
      };

      return res.status(200).send(returnData);
    }
    const decodedToken = await decodeToken(authCookie);
    if (!decodedToken || !decodedToken?.wallet !== wallet) {
      deleteCookie('authToken', {
        res,
        req,
      });
      return res.status(400).send({ message: 'Invalid Token' });
    }
    const returnData: AuthCheckReturn = {
      data: {
        user: decodedToken,
        type: 'EXISTING_USER',
      },
      error: null,
    };

    return res.status(200).send(returnData);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Internal Server Error' });
  }
}

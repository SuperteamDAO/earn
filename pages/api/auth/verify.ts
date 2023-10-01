/* eslint-disable no-unsafe-optional-chaining */
import { utils, web3 } from '@project-serum/anchor';
import { setCookie } from 'cookies-next';
import type { NextApiRequest, NextApiResponse } from 'next';

import type { AuthPayload } from '@/interface/auth';
import { prisma } from '@/prisma';
import { verifyMessage } from '@/utils/auth/verifyMessage';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { signature, publicKey } = req.body;
    const nonce = req.headers['x-auth-nonce'];
    const hash = nonce + process.env.SECRET?.slice(0, 10)!;
    const check = utils.sha256.hash(hash);

    const result = verifyMessage(
      signature,
      new web3.PublicKey(publicKey),
      check
    );
    if (result) {
      const user = await prisma.user.findUnique({
        where: {
          publicKey,
        },
      });
      if (!user) {
        return res.status(400).send({ error: 'Invalid PublicKey' });
      }
      const userSessionPayload: AuthPayload = {
        id: user.id,
        profilePicture: user.photo as string,
        type: user.role,
        username: user.username,
        wallet: user.username,
        firstName: user.firstName as string,
        lastName: user.lastName as string,
      };
      setCookie('authToken', userSessionPayload, {
        req,
        res,
        expires: new Date(Date.now() + 3600000),
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
      });
      return res.status(200).send({
        data: res,
        user: userSessionPayload,
        error: null,
      });
    }
    return res.status(400).send({ message: 'Error Verifying Signature' });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: 'Internal Server Error' });
  }
}

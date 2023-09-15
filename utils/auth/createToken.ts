import { SignJWT } from 'jose';

import type { AuthPayload } from '@/interface/auth';

export const createToken = async (tokenPayload: AuthPayload) => {
  try {
    const secret = new TextEncoder().encode(process.env.SECRET);
    const alg = 'HS256';
    const token = new SignJWT(tokenPayload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);

    return await token;
  } catch (error) {
    console.log(error);
    return null;
  }
};

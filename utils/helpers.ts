// @ts-ignore
import base32 from 'base32.js';
import Crypto from 'crypto-js';
import { nanoid } from 'nanoid';
import { v4 as uuidV4 } from 'uuid';

export const truncatedPublicKey = (publicKey: string, length: number = 5) => {
  if (!publicKey) return null;
  return publicKey?.replace(publicKey.slice(length, 44 - length), '...');
};
export const genrateNanoid = () => {
  const id = nanoid();
  return id;
};
export const genrateuuid = () => {
  const id = uuidV4();
  return id;
};

export const genrateCode = (seed: string) => {
  const time = Date.now();
  const message = Math.floor(time / 5000);
  const decoder = new base32.Encoder({ type: 'crockford', lc: true });
  const hash = Crypto.HmacSHA1(
    message.toString(),
    decoder.write(seed).finalize()
  );
  // eslint-disable-next-line no-bitwise
  const code = hash?.words[0]! & 0x7fffffff;
  return code % 1000000;
};
export const genrateCodeLast = (seed: String) => {
  const time = Date.now() - 5000;
  const message = Math.floor(time / 5000);
  const decoder = new base32.Encoder({ type: 'crockford', lc: true });
  const hash = Crypto.HmacSHA1(
    message.toString(),
    decoder.write(seed).finalize()
  );
  // eslint-disable-next-line no-bitwise
  const code = hash?.words[0]! & 0x7fffffff;
  return code % 1000000;
};

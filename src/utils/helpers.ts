// @ts-ignore
import base32 from 'base32.js';
import Crypto from 'crypto-js';

export const generateCode = (seed: string | undefined, time: number) => {
  const message = Math.floor(time / 5000);
  const decoder = new base32.Encoder({ type: 'crockford', lc: true });
  const hash = Crypto.HmacSHA1(
    message.toString(),
    decoder.write(seed).finalize()
  );
  // eslint-disable-next-line no-bitwise
  let code = hash?.words[0]! & 0x7fffffff;
  code %= 1000000;
  if (code < 100000) {
    code += 100000;
  }
  return code;
};
export const generateCodeLast = (seed: string | undefined, time: number) => {
  const pastTime = time - 5000;
  const message = Math.floor(pastTime / 5000);
  const decoder = new base32.Encoder({ type: 'crockford', lc: true });
  const hash = Crypto.HmacSHA1(
    message.toString(),
    decoder.write(seed).finalize()
  );
  // eslint-disable-next-line no-bitwise
  let code = hash?.words[0]! & 0x7fffffff;
  code %= 1000000;
  if (code < 100000) {
    code += 100000;
  }
  return code;
};

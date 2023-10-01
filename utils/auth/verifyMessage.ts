import type { web3 } from '@project-serum/anchor';
import { utils } from '@project-serum/anchor';
import nacl from 'tweetnacl';

import { createMessage } from './createMessage';

export const verifyMessage = (
  signature: string,
  publicKey: web3.PublicKey,
  hash: string
) => {
  const message = createMessage(hash);
  if (!message) {
    return false;
  }

  const result = nacl.sign.detached.verify(
    message,
    utils.bytes.bs58.decode(signature),
    publicKey.toBuffer()
  );

  return result;
};

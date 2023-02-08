import { nanoid } from 'nanoid';
import { v4 as uuidV4 } from 'uuid';
export const truncatedPublicKey = (publicKey: string, length?: number) => {
  if (!publicKey) return;
  if (!length) {
    length = 5;
  }
  return publicKey.replace(publicKey.slice(length, 44 - length), '...');
};
export const verifyCode = () => {};
export const genrateNanoid = () => {
  const id = nanoid();
  return id;
};
export const genrateuuid = () => {
  const id = uuidV4();
  return id;
};

export const truncatePublicKey = (
  publicKey: string = '',
  length: number = 4,
) => {
  if (publicKey.length <= length) {
    return publicKey;
  }
  return `${publicKey?.substring(0, length / 2)}....${publicKey?.substring(
    publicKey.length - length / 2,
  )}`;
};

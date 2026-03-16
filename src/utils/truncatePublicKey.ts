export const truncatePublicKey = (
  publicKey: string = '',
  length: number = 4,
) => {
  if (!publicKey) {
    return '';
  }

  if (publicKey.length <= length * 2) {
    return publicKey;
  }

  return `${publicKey.substring(0, length)}...${publicKey.substring(
    publicKey.length - length,
  )}`;
};

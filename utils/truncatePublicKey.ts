export const truncatePublicKey = (publicKey: string = '') => {
  return `${publicKey?.substring(0, 4)}....${publicKey?.substring(
    publicKey.length - 4,
    publicKey?.length
  )}`;
};

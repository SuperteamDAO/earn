export const truncatePublicKey = (
  publicKey: string = '',
  length: number = 4,
) => {
  return `${publicKey?.substring(0, length)}....${publicKey?.substring(
    publicKey.length - length,
    publicKey?.length,
  )}`;
};

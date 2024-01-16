export const truncatePublicKey = (publicKey: string = '') => `${publicKey?.substring(0, 4)}....${publicKey?.substring(
    publicKey.length - 4,
    publicKey?.length,
  )}`;

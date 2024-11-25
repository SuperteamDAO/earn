export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(() => resolve(false), ms));

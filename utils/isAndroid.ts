export const isAndroid = (): boolean => {
  return /Android/i.test(navigator.userAgent);
};

export const isValidHttpUrl = (string: string) => {
  if (string.length === 0) {
    return true;
  }
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
};

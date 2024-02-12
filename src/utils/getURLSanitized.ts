export const getURLSanitized = (url: string) => {
  if (!url || url === '-' || url === '#') return url;
  if (
    !url.includes('https://') &&
    !url.includes('http://') &&
    !url.includes('www')
  ) {
    return `https://${url}`;
  }
  return url;
};

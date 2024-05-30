export const getURLSanitized = (url: string) => {
  if (!url || url === '-' || url === '#') return url;

  const isEmail =
    url.includes('@') && !url.includes('http://') && !url.includes('https://');

  if (isEmail) {
    return `mailto:${url}`;
  }

  if (
    !url.includes('https://') &&
    !url.includes('http://') &&
    !url.includes('www')
  ) {
    return `https://${url}`;
  }

  return url;
};

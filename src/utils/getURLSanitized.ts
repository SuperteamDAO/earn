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

export const getTwitterUrl = (raw: string) => {
  const trimmed = raw.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('twitter.com/')) {
      return trimmed;
    }
  }

  if (
    trimmed.startsWith('www.twitter.com/') ||
    trimmed.startsWith('twitter.com/')
  ) {
    return 'https://' + trimmed;
  }

  const username = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;

  if (username.includes('twitter.com/')) {
    const parts = username.split('twitter.com/');
    return `https://twitter.com/${parts[parts.length - 1]}`;
  }

  return `https://twitter.com/${username}`;
};

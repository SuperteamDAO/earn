export const getURLSanitized = (url: string) => {
  if (!url || url === '-' || url === '#') return url;

  const isEmail =
    url.includes('@') && !url.includes('http://') && !url.includes('https://');

  if (isEmail) {
    return `mailto:${url}`;
  }

  if (!url.includes('https://') && !url.includes('http://')) {
    return `https://${url}`;
  }

  return url;
};

export const getTwitterUrl = (raw: string) => {
  const trimmed = raw.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('x.com/') || trimmed.includes('twitter.com/')) {
      return trimmed;
    }
  }

  if (
    trimmed.startsWith('www.x.com/') ||
    trimmed.startsWith('x.com/') ||
    trimmed.startsWith('www.twitter.com/') ||
    trimmed.startsWith('twitter.com/')
  ) {
    return 'https://' + trimmed;
  }

  const username = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;

  if (username.includes('x.com/')) {
    const parts = username.split('x.com/');
    return `https://x.com/${parts[parts.length - 1]}`;
  }

  if (username.includes('twitter.com/')) {
    const parts = username.split('twitter.com/');
    return `https://x.com/${parts[parts.length - 1]}`;
  }

  return `https://x.com/${username}`;
};

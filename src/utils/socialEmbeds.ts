// Tweeter takes URL in text itself
export function tweetEmbedLink(content: string) {
  const tweetUrl = new URL(`https://twitter.com/intent/tweet`);
  tweetUrl.searchParams.set('text', content);
  const stringUrl = tweetUrl.toString();
  return stringUrl;
}

// Telegram takes URL as separate parameter
export function telegramShareLink(link: string, content: string) {
  const tgUrl = new URL('https://t.me/share');
  tgUrl.searchParams.set('url', link);
  tgUrl.searchParams.set('text', content);
  const stringUrl = tgUrl.toString();
  return stringUrl;
}

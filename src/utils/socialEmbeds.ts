// Tweeter takes URL in text itself
export function tweetEmbedLink(content: string) {
  const tweetUrl = new URL(`https://twitter.com/intent/tweet`);
  tweetUrl.searchParams.set('text', content);
  const stringUrl = tweetUrl.toString();
  return stringUrl;
}

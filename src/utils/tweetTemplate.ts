export function tweetTemplate(url: string) {
  return `The results of this latest @SuperteamEarn listing are out. Congratulations to the winners👏

${url}
`;
}

export function tweetEmbedLink(content: string) {
  const tweetUrl = new URL(`https://twitter.com/intent/tweet`);
  tweetUrl.searchParams.set('text', content);
  const stringUrl = tweetUrl.toString();
  return stringUrl;
}

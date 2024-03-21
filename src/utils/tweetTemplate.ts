export function tweetTemplate(url: string) {
  return `The results of this latest @SuperteamEarn listing are out. Congratulations to the winners👏

${url}
`;
}

export function tweetEmbedLink(content: string) {
  const tweetUrl = new URL(`https://twitter.com/intent/tweet`);
  tweetUrl.searchParams.set('text', content);
  let stringUrl = tweetUrl.toString();
  if (stringUrl[stringUrl.length - 1] === '/') {
    stringUrl = stringUrl.slice(0, stringUrl.length - 1);
  }
  return stringUrl;
}

export function tweetTemplate(name: string, isTag: boolean, url: string) {
  return `
The results of the latest ${isTag ? '@' : ''}${name} are out. Congratulations to the winners:
${url}
`;
}

export function tweetEmbedLink(content: string) {
  const tweetUrl = new URL(`https://twitter.com/intent/tweet`);
  tweetUrl.searchParams.set('text', content);
  return tweetUrl.toString();
}

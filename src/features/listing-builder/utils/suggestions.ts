interface Suggestions {
  tokens: string[];
  suggestions: {
    label: string;
    link: string;
  }[];
}
const bountySuggestions: Suggestions[] = [
  {
    tokens: ['Twitter', 'Thread'],
    suggestions: [
      {
        label: 'Twitter Thread on Rome Protocol',
        link: 'https://earn.superteam.fun/listings/bounty/write-a-twitter-thread-on-rome-protocol/',
      },
      {
        label: 'History of Bonk [Twitter Thread]',
        link: 'https://earn.superteam.fun/listings/bounty/history-of-bonk-twitter-thread/',
      },
    ],
  },
  {
    tokens: ['Deep Dive', 'Article'],
    suggestions: [
      {
        label: 'Deep Dive on ONDC Network',
        link: 'https://earn.superteam.fun/listings/bounty/deep-dive-on-the-state-of-the-ondc-network/',
      },
      {
        label: 'Deep Dive on Monaco Protocol',
        link: 'https://earn.superteam.fun/listings/bounty/deep-dive-on-monaco-protocol-article/',
      },
    ],
  },
  {
    tokens: ['Design', 'Redesign'],
    suggestions: [
      {
        label: 'Design y00ts Dashboard',
        link: 'https://earn.superteam.fun/listings/bounty/y00ts-royalty-dashboard-design/',
      },
      {
        label: 'Redesign Symmetry App',
        link: 'https://earn.superteam.fun/listings/bounty/redesign-symmetry-app/',
      },
    ],
  },
];

export function getBountySuggestions(input: string) {
  return bountySuggestions
    .filter((row) =>
      row.tokens.some((token) =>
        input.toLowerCase().includes(token.toLowerCase()),
      ),
    )
    .flatMap((row) => row.suggestions);
}

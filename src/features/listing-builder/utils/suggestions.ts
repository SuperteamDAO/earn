interface Suggestions {
  tokens: string[];
  suggestions: {
    label: string;
    link: string;
  }[];
}
const bountySuggestions: Suggestions[] = [
  // {
  //   tokens: ['Twitter', 'Thread'],
  //   suggestions: [
  //     {
  //       label: 'Twitter Thread on Rome Protocol',
  //       link: 'https://earn.superteam.fun/listing/write-a-twitter-thread-on-rome-protocol/',
  //     },
  //     {
  //       label: 'History of Bonk [Twitter Thread]',
  //       link: 'https://earn.superteam.fun/listing/history-of-bonk-twitter-thread/',
  //     },
  //   ],
  // },
  // {
  //   tokens: ['Deep Dive', 'Article'],
  //   suggestions: [
  //     {
  //       label: 'Deep Dive on ONDC Network',
  //       link: 'https://earn.superteam.fun/listing/deep-dive-on-the-state-of-the-ondc-network/',
  //     },
  //     {
  //       label: 'Deep Dive on Monaco Protocol',
  //       link: 'https://earn.superteam.fun/listing/deep-dive-on-monaco-protocol-article/',
  //     },
  //   ],
  // },
  // {
  //   tokens: ['Design', 'Redesign'],
  //   suggestions: [
  //     {
  //       label: 'Design y00ts Dashboard',
  //       link: 'https://earn.superteam.fun/listing/y00ts-royalty-dashboard-design/',
  //     },
  //     {
  //       label: 'Redesign Symmetry App',
  //       link: 'https://earn.superteam.fun/listing/redesign-symmetry-app/',
  //     },
  //   ],
  // },
];

const projectSuggestions: Suggestions[] = [];

const hackathonSuggestions: Suggestions[] = [];

const sponsorshipSuggestions: Suggestions[] = [];

function calculateSuggestions(suggestions: Suggestions[], input: string) {
  return suggestions
    .filter((row) =>
      row.tokens.some((token) =>
        input.toLowerCase().includes(token.toLowerCase()),
      ),
    )
    .flatMap((row) => row.suggestions);
}

export function getSuggestions(
  input: string | undefined,
  type: 'bounty' | 'project' | 'hackathon' | 'sponsorship',
) {
  if (!input) return [];
  if (type === 'bounty') {
    return calculateSuggestions(bountySuggestions, input);
  }
  if (type === 'project') {
    return calculateSuggestions(projectSuggestions, input);
  }
  if (type === 'sponsorship') {
    return calculateSuggestions(sponsorshipSuggestions, input);
  }
  if (type === 'hackathon') {
    return calculateSuggestions(hackathonSuggestions, input);
  }
  return [];
}

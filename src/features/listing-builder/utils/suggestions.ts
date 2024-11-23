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
        link: '',
      },
      {
        label: 'History of Bonk [Twitter Thread]',
        link: '',
      },
    ],
  },
  {
    tokens: ['Deep Dive', 'Article'],
    suggestions: [
      {
        label: 'Deep Dive on ONDC Network',
        link: '',
      },
      {
        label: 'Deep Dive on Monaco Protocol',
        link: '',
      },
    ],
  },
  {
    tokens: ['Design', 'Redesign'],
    suggestions: [
      {
        label: 'Design y00ts Dashboard',
        link: '',
      },
      {
        label: 'Redesign Symmetry App',
        link: '',
      },
    ],
  },
];

const projectSuggestions: Suggestions[] = [];

const hackathonSuggestions: Suggestions[] = [];

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
  type: 'bounty' | 'project' | 'hackathon',
) {
  if (!input) return [];
  if (type === 'bounty') {
    return calculateSuggestions(bountySuggestions, input);
  }
  if (type === 'project') {
    return calculateSuggestions(projectSuggestions, input);
  }
  if (type === 'hackathon') {
    return calculateSuggestions(hackathonSuggestions, input);
  }
  return [];
}

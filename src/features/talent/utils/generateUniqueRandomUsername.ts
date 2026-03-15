import { prisma } from '@/prisma';
import { slugify } from '@/utils/slugify';

const MAX_USERNAME_ATTEMPTS = 10;
const USERNAME_ADJECTIVES = [
  'bright',
  'calm',
  'clever',
  'cosmic',
  'crisp',
  'curious',
  'daring',
  'eager',
  'electric',
  'gentle',
  'golden',
  'lucky',
  'nimble',
  'nova',
  'plucky',
  'quiet',
  'rapid',
  'shiny',
  'silky',
  'smart',
  'solid',
  'spark',
  'stellar',
  'swift',
  'tidy',
  'vivid',
  'wild',
  'wise',
] as const;
const USERNAME_COLORS = [
  'amber',
  'azure',
  'bronze',
  'coral',
  'crimson',
  'cyan',
  'emerald',
  'gold',
  'indigo',
  'jade',
  'lilac',
  'lime',
  'navy',
  'olive',
  'onyx',
  'pearl',
  'pink',
  'ruby',
  'sable',
  'scarlet',
  'silver',
  'teal',
  'topaz',
  'violet',
] as const;

function pickRandomValue(values: readonly string[]) {
  return values[Math.floor(Math.random() * values.length)]!;
}

function shuffleValues<T>(values: readonly T[]) {
  const nextValues = [...values];

  for (let index = nextValues.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextValues[index], nextValues[swapIndex]] = [
      nextValues[swapIndex]!,
      nextValues[index]!,
    ];
  }

  return nextValues;
}

function toUsernameToken(value?: string) {
  return slugify(value || '', { lower: true }).replace(/-/g, '');
}

export async function generateUniqueRandomUsername(
  firstName?: string,
): Promise<string | null> {
  const dictionaries = [USERNAME_ADJECTIVES, USERNAME_COLORS] as const;
  const firstNameToken = toUsernameToken(firstName);

  for (let attempt = 0; attempt < MAX_USERNAME_ATTEMPTS; attempt++) {
    let shuffledDictionaries = shuffleValues(dictionaries);
    shuffledDictionaries = firstNameToken
      ? shuffledDictionaries.slice(0, 1)
      : shuffledDictionaries.slice(0, 2);

    const usernameParts = [
      ...(firstNameToken ? [firstNameToken] : []),
      ...shuffledDictionaries.map(pickRandomValue),
      String(Math.floor(Math.random() * 99) + 1),
    ];

    const generatedUsername = usernameParts
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');

    const user = await prisma.user.findUnique({
      where: { username: generatedUsername },
      select: { id: true },
    });

    if (!user) return generatedUsername;
  }

  return null;
}

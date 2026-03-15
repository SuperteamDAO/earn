import {
  adjectives,
  colors,
  type Config,
  NumberDictionary,
  uniqueNamesGenerator,
} from 'unique-names-generator';

import { prisma } from '@/prisma';

const MAX_USERNAME_ATTEMPTS = 10;

export async function generateUniqueRandomUsername(
  firstName?: string,
): Promise<string | null> {
  const numberDictionary = NumberDictionary.generate({ min: 1, max: 99 });
  const dictionaries = [adjectives, colors];

  for (let attempt = 0; attempt < MAX_USERNAME_ATTEMPTS; attempt++) {
    let shuffledDictionaries = [...dictionaries].sort(
      () => Math.random() - 0.5,
    );
    shuffledDictionaries = firstName
      ? shuffledDictionaries.slice(0, 1)
      : shuffledDictionaries.slice(0, 2);

    const randUserConfig: Config = {
      dictionaries: [...shuffledDictionaries, numberDictionary],
      separator: '-',
      length: firstName ? 2 : 3,
      style: 'lowerCase',
    };

    let generatedUsername = uniqueNamesGenerator(randUserConfig);
    if (firstName)
      generatedUsername = firstName.toLowerCase() + '-' + generatedUsername;

    generatedUsername = generatedUsername
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

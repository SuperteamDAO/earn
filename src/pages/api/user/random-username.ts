import type { NextApiRequest, NextApiResponse } from 'next';
import {
  adjectives,
  colors,
  type Config,
  NumberDictionary,
  uniqueNamesGenerator,
} from 'unique-names-generator';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function checkUsername(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  logger.info(`Request query: ${safeStringify(req.query)}`);

  if (req.method !== 'GET') {
    logger.warn(`Method not allowed: ${req.method}`);
    return res.status(405).end('Method Not Allowed');
  }

  const { firstName } = req.query;

  if (firstName && typeof firstName !== 'string') {
    logger.warn('Invalid firstName parameter');
    return res.status(400).json({ error: 'firstName is must be a string.' });
  }

  const numberDictionary = NumberDictionary.generate({ min: 1, max: 99 });
  const dictionaries = [adjectives, colors];

  let username: string | undefined;
  let attempt = 0;

  try {
    while (attempt < 10) {
      let shuffledDictionaries = dictionaries.sort(() => Math.random() - 0.5);
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

      logger.debug(
        `Attempt ${attempt + 1}: Checking username ${generatedUsername}`,
      );

      generatedUsername = generatedUsername
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-');

      const user = await prisma.user.findUnique({
        where: { username: generatedUsername },
      });

      if (!user) {
        username = generatedUsername;
        break;
      }

      logger.info(
        `Attempt ${attempt + 1}: Username ${generatedUsername} is not available.`,
      );
      attempt++;
    }

    if (!username) {
      logger.error('Could not find a unique username after 10 attempts.');
      return res.status(500).json({
        error: 'Could not generate a unique username. Please try again.',
      });
    }

    logger.info(`Username ${username} is available`);
    return res.status(200).json({ available: true, username });
  } catch (error: any) {
    logger.error(
      `Error occurred while checking username availability: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: 'Error occurred while checking the username availability.',
    });
  }
}

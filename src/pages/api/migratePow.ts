import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function migratePow(
  _req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    // Fetch all users from the database
    const users = await prisma.user.findMany({
      select: { id: true, pow: true, createdAt: true },
    });

    if (users.length === 0) {
      res.status(404).json({ message: `No users found.` });
      return;
    }

    // Loop over each user and migrate their pow field
    // eslint-disable-next-line no-restricted-syntax
    for (const user of users) {
      if (!user.pow) {
        console.log(`User with id=${user.id} has no pow field to migrate.`);
        // eslint-disable-next-line no-continue
        continue;
      }

      const powDataArray = JSON.parse(user.pow);

      // eslint-disable-next-line no-restricted-syntax
      for (const powDataString of powDataArray) {
        const powData = JSON.parse(powDataString);
        const { title, description, link, skills, subSkills } = powData;

        const newPoWData = {
          userId: user.id,
          title,
          description,
          link,
          skills,
          subSkills,
          createdAt: user.createdAt,
        };

        console.log('Attempting to insert:', newPoWData);

        // eslint-disable-next-line no-await-in-loop
        await prisma.poW.create({ data: newPoWData });
      }
    }

    res.status(200).json({
      message: `Successfully migrated the pow field for all users`,
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({
      error: error.message,
      message: `Error occurred while migrating the pow field for users.`,
    });
  }
}

import { promises as fs } from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

import { prisma } from '@/prisma';

export default async function userFunc(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const jsonDirectory = path.join(process.cwd(), '/public/assets/data');
    const usersString = await fs.readFile(
      `${jsonDirectory}/users.json`,
      'utf8'
    );
    const usersParsed = JSON.parse(usersString as unknown as string);

    usersParsed.map(async (user: any, i: number) => {
      console.log('Adding ', i);
      //          skills
      const skillsParsed = JSON.parse(user.skills || '{}');
      const skills = Object.keys(skillsParsed);
      const subSkills = skills.reduce((t: any, cc: any) => {
        return [...t, ...skillsParsed[cc]];
      }, []);

      await prisma.user.create({
        data: {
          publicKey: user.publicKey || undefined,
          email: user.email || undefined,
          photo: user.photo || undefined,
          bio: user.bio || undefined,
          currentEmployer: user.currentEmployer || undefined,
          cryptoExperience: user.cryptoExperience || undefined,
          workPrefernce: user.workPrefernce || undefined,
          experience: user.experience || undefined,
          interests: user.interests || undefined,
          username: user.username || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          superteamLevel: user.superteamLevel || undefined,
          totalEarnedInUSD: user.totalEarnedInUSD || undefined,
          github: user.github || undefined,
          twitter: user.twitter || undefined,
          linkedin: user.linkedin || undefined,
          website: user.website || undefined,
          community: user.community || undefined,
          location: user.location || undefined,
          discord: user.discord || undefined,
          isVerified: !!user.email,
          isTalentFilled: true,
          skills: skills.join(','),
          subSkills: subSkills.join(','),
        },
      });
      console.log('Successfully Added', i);
      return i;
    });
    res.status(200).json(usersParsed?.length);
  } catch (error) {
    console.log('file: create.ts:29 ~ user ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new user.',
    });
  }
}

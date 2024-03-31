import { verifySignature } from '@upstash/qstash/dist/nextjs';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

import { type User } from '@/interface/user';
import { prisma } from '@/prisma';

function airtableUrl() {
  const baseId = process.env.AIRTABLE_BASE_ID,
    tableName = process.env.AIRTABLE_TABLE_NAME;
  if (!baseId || !tableName)
    throw new Error('AIRTABLE BASE ID OR TABLE NAME NOT PROVIDED');

  return `https://api.airtable.com/v0/${baseId}/${tableName}`;
}

function airtableConfig() {
  const apiToken = process.env.AIRTABLE_API_TOKEN;
  if (!apiToken) throw new Error('AIRTABLE API TOKEN NOT PROVIDED');
  return {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
  };
}

function airtableUpsert(mergeOn: any, data: any[]) {
  return {
    performUpsert: {
      fieldsToMergeOn: [mergeOn],
    },
    records: data,
  };
}

interface ForFoundersAirtableSchema {
  id: string;
  publicKey?: string;
  'Email ID': string;
  'Earn Username'?: string;
  photo?: string;
  'First Name'?: string;
  'Last Name'?: string;
  createdAt: string;
  updatedAt: string;
  isVerified: string;
  role: string;
  'Total Earned in USD on Earn/ST': string;
  isTalentFilled: string;
  interests?: string;
  Bio?: string;
  Twitter?: string;
  Discord?: string;
  Github?: string;
  Linkedin?: string;
  Website?: string;
  Telegram?: string;
  Community?: string;
  'Work Experience'?: string;
  superteamLevel?: string;
  Country?: string;
  'Crypto Experience'?: string;
  'Work Preference'?: string;
  'Current Employer'?: string;
  pow?: string;
  notifications?: string;
  private: string;
  skills?: string;
  currentSponsorId?: string;
  Design?: string;
  Frontend?: string;
  Backend?: string;
  Blockchain?: string;
  Content?: string;
  Mobile?: string;
  'Community 2'?: string;
  Growth?: string;
  Other?: string;
  'Talent Profile non UTM'?: string;
  // "Contact Talent Via"?: string,
  'Self Selected Skills'?: string[];
}

function talentProfileNonUtmLink(username: string) {
  return `https://earn.superteam.fun/t/${username}`;
}

interface Skills {
  skills: string | undefined;
  subSkills: string[];
}
function extractSkills(skills: Skills[]) {
  return skills
    .map((item) => item.skills ?? undefined)
    .filter((element) => element !== undefined) as string[];
}

function convertUserToAirtable(user: User): ForFoundersAirtableSchema {
  return {
    id: user.id || '',
    publicKey: user.publicKey ?? undefined,
    'Email ID': user.email || '',
    'Earn Username': user.username ?? undefined,
    photo: user.photo ?? undefined,
    'First Name': user.firstName ?? undefined,
    'Last Name': user.lastName ?? undefined,
    createdAt: ((user.createdAt || '') as any as Date).toLocaleString(),
    updatedAt: ((user.updatedAt || '') as any as Date).toLocaleString(),
    isVerified: String(user.isVerified ? 1 : 0),
    role: user.role ?? 'USER',
    'Total Earned in USD on Earn/ST': String(user.totalEarnedInUSD ?? 0),
    isTalentFilled: String(user.isTalentFilled ? 1 : 0),
    interests: user.interests ?? undefined,
    Bio: user.bio ?? undefined,
    Twitter: user.twitter ?? undefined,
    Discord: user.discord ?? undefined,
    Github: user.github ?? undefined,
    Linkedin: user.linkedin ?? undefined,
    Website: user.website ?? undefined,
    Telegram: user.telegram ?? undefined,
    Community: user.community ?? undefined,
    'Work Experience': user.workPrefernce ?? undefined,
    superteamLevel: user.superteamLevel ?? undefined,
    Country: user.location ?? undefined,
    'Crypto Experience': user.cryptoExperience ?? undefined,
    'Work Preference': user.workPrefernce ?? undefined,
    'Current Employer': user.currentEmployer ?? undefined,
    pow: user.pow ?? undefined,
    notifications: undefined,
    private: String(user.private ? 1 : 0),
    skills: JSON.stringify(user.skills ?? {}) ?? undefined,
    currentSponsorId: user.currentSponsorId ?? undefined,
    'Talent Profile non UTM': user.username
      ? talentProfileNonUtmLink(user.username)
      : undefined,
    'Self Selected Skills': user.skills
      ? extractSkills(user.skills as any as Skills[]) ?? []
      : [],
  };
}

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  let count = 0;
  const startTime = performance.now();
  let endTime = performance.now();
  try {
    // GET LAST UPDATED RECORD
    const listUrl = new URL(airtableUrl());
    listUrl.searchParams.set('maxRecords', '1');
    listUrl.searchParams.set('sort[0][field]', 'Last Modified');
    listUrl.searchParams.set('sort[0][direction]', 'desc');

    const resp = await axios.get(listUrl.toString(), airtableConfig());
    const listData = resp.data;
    if (!listData || !listData.records) {
      throw new Error('no data');
    }
    const listTime = listData.records[0].fields['Last Modified'] as string;
    const lastCronDateTime = new Date(listTime);
    if (!lastCronDateTime) {
      throw new Error('no date');
    }

    let cursor: string | undefined = undefined;
    let users = await prisma.user.findMany({
      take: 10,
      where: {
        updatedAt: {
          gt: lastCronDateTime,
        },
      },
    });
    if (users.length === 0) {
      res.status(200).json({ message: 'Airtable already up-to-date ' });
      return;
    }

    const usersAirtable: {
      fields: ForFoundersAirtableSchema;
    }[] = [];
    for (const user of users) {
      usersAirtable.push({
        fields: convertUserToAirtable(user as any),
      });
    }

    const data = airtableUpsert('id', usersAirtable);
    console.log('data - ', data);
    await axios.patch(airtableUrl(), JSON.stringify(data), airtableConfig());
    count++;

    do {
      cursor = users[9]?.id ?? undefined;
      if (!cursor) break;
      users = await prisma.user.findMany({
        take: 10,
        skip: 1,
        cursor: { id: cursor },
        where: {
          updatedAt: {
            gt: lastCronDateTime,
          },
        },
      });

      const usersAirtable: {
        fields: ForFoundersAirtableSchema;
      }[] = [];
      for (const user of users) {
        usersAirtable.push({
          fields: convertUserToAirtable(user as any),
        });
      }
      await axios.patch(
        airtableUrl(),
        airtableUpsert('id', usersAirtable),
        airtableConfig(),
      );
      count++;
    } while (cursor);
    console.log('count - ', count);

    endTime = performance.now();
    console.log('full performance time - ', endTime - startTime);
    res.status(200).json({ message: 'Airtable Synced successfully' });
  } catch (error: any) {
    console.log('count - ', count);
    console.error('Error airtable sync:', error);
    if (error?.response?.data)
      console.error('Airtable Error', error.response.data);
    res
      .status(500)
      .json({ message: 'An error occurred while syncing airtable.' });
  }
}

export default verifySignature(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { airtableUrl } from '@/utils/airtable';
import { safeStringify } from '@/utils/safeStringify';

export type RefreshUserMembershipLevelInput = {
  userId: string;
  email: string;
  currentSuperteamLevel: string | null;
};

type AirtablePeopleFields = {
  Email?: string;
  Region?: string;
  'Person Type'?: string;
};

type AirtablePeopleResponse = {
  records?: Array<{
    fields?: AirtablePeopleFields;
  }>;
  offset?: string;
};

function escapeAirtableString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function fetchPeopleRecordsByFormula(
  peopleUrl: string,
  apiToken: string,
  formula: string,
): Promise<AirtablePeopleFields[]> {
  const records: AirtablePeopleFields[] = [];
  let offset: string | undefined;

  do {
    const queryUrl = new URL(peopleUrl);
    queryUrl.searchParams.set('filterByFormula', formula);

    if (offset) {
      queryUrl.searchParams.set('offset', offset);
    }

    const response = await fetch(queryUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Airtable request failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as AirtablePeopleResponse;
    records.push(
      ...(data.records
        ?.map((record) => record.fields)
        .filter((field): field is AirtablePeopleFields => !!field) ?? []),
    );
    offset = data.offset;
  } while (offset);

  return records;
}

export async function refreshUserMembershipLevel({
  userId,
  email,
  currentSuperteamLevel: _currentSuperteamLevel,
}: RefreshUserMembershipLevelInput): Promise<void> {
  const peopleBaseId = process.env.AIRTABLE_PEOPLE_BASE_ID;
  const peopleTable = process.env.AIRTABLE_PEOPLE_COMMUNITY_TABLE;
  const peopleApiToken = process.env.AIRTABLE_PEOPLE_API_TOKEN;

  if (!peopleBaseId || !peopleTable || !peopleApiToken) {
    logger.debug(
      'Skipping membership refresh: Airtable people envs are not fully configured',
      { userId },
    );
    return;
  }

  const peopleUrl = airtableUrl(peopleBaseId, peopleTable);

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    logger.debug('Skipping membership refresh: user has no email', { userId });
    return;
  }

  const escapedEmail = escapeAirtableString(normalizedEmail);
  const memberFormula = `AND(LOWER({Email})='${escapedEmail}', {Person Type}='Member')`;
  const contributorFormula = `AND(LOWER({Email})='${escapedEmail}', {Person Type}='Contributor', NOT(BLANK({mem status updated time})))`;

  try {
    const memberRecords = await fetchPeopleRecordsByFormula(
      peopleUrl,
      peopleApiToken,
      memberFormula,
    );
    let nextSuperteamLevel: string | null = null;

    if (memberRecords.length > 0) {
      const latestMemberRecord = memberRecords.at(-1);
      if (!latestMemberRecord) {
        logger.debug('Membership refresh found no usable member record', {
          userId,
          email: normalizedEmail,
        });
      } else {
        nextSuperteamLevel = `Superteam ${latestMemberRecord.Region}`;
      }
    }

    const contributorRecords = await fetchPeopleRecordsByFormula(
      peopleUrl,
      peopleApiToken,
      contributorFormula,
    );

    if (contributorRecords.length > 0) {
      nextSuperteamLevel = 'Contributor';
    }

    if (nextSuperteamLevel) {
      const result = await prisma.user.updateMany({
        where: { email: normalizedEmail },
        data: { superteamLevel: nextSuperteamLevel },
      });

      if (result.count > 0) {
        logger.info('Membership refresh updated superteamLevel', {
          userId,
          email: normalizedEmail,
          superteamLevel: nextSuperteamLevel,
          count: result.count,
        });
      } else {
        logger.debug('Membership refresh found no matching users', {
          userId,
          email: normalizedEmail,
        });
      }
      return;
    }

    logger.debug('Membership refresh found no superteamLevel change', {
      userId,
    });
  } catch (error) {
    logger.warn('Membership refresh errored', {
      userId,
      error: safeStringify(error),
    });
  }
}

import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

import { type GrantApplicationWithUser } from '@/features/sponsor-dashboard';
import { prisma } from '@/prisma';
import { airtableConfig, airtableUpsert, airtableUrl } from '@/utils/airtable';

interface GrantApplicationWithUserAndGrant extends GrantApplicationWithUser {
  grant: {
    airtableId: string | null;
  };
}

interface GrantApplicationAirtableSchema {
  earnGrantApplicationId: string;
  Title: string;
  Status: string;
  Summary: string;
  Funding: number;
  KPI: string | undefined;
  'Proof of Work': string;
  Name: string;
  'Contact Email': string;
  'Twitter URL': string | undefined;
  'SOL Wallet': string;
  Milestones: string | undefined;
  Grants: string[];
  Description: string;
  'Discord Handle': string | undefined;
  Deadline: string;
}

function convertGrantApplicationToAirtable(
  grantApplication: GrantApplicationWithUserAndGrant,
): GrantApplicationAirtableSchema {
  let status;
  switch (grantApplication.applicationStatus) {
    case 'Pending':
      status = 'Undecided';
      break;
    case 'Approved':
      status = 'Accepted';
      break;
    case 'Rejected':
      status = 'Rejected';
      break;
    default:
      status = grantApplication.applicationStatus;
  }
  return {
    earnGrantApplicationId: grantApplication.id,
    Title: grantApplication.projectTitle,
    Status: status,
    Summary: grantApplication.projectOneLiner,
    Funding: grantApplication.approvedAmount || grantApplication.ask,
    KPI: grantApplication.kpi ?? undefined,
    'Proof of Work': grantApplication.proofOfWork,
    Name: `${grantApplication.user.firstName} ${grantApplication.user.lastName}`,
    'Contact Email': grantApplication.user.email,
    'Twitter URL': grantApplication.user.twitter ?? undefined,
    'SOL Wallet': grantApplication.walletAddress,
    Milestones: grantApplication.milestones ?? undefined,
    Grants: [grantApplication.grant.airtableId!],
    Description: grantApplication.projectDetails,
    'Discord Handle': grantApplication.user.discord ?? undefined,
    Deadline: grantApplication.projectTimeline,
  };
}

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const config = airtableConfig(process.env.AIRTABLE_GRANTS_API_TOKEN!);
    const url = airtableUrl(
      process.env.AIRTABLE_GRANTS_BASE_ID!,
      process.env.AIRTABLE_GRANTS_TABLE_NAME!,
    );

    const listUrl = new URL(url);
    listUrl.searchParams.set('maxRecords', '1');
    listUrl.searchParams.set('sort[0][field]', 'Last Modified');
    listUrl.searchParams.set('sort[0][direction]', 'desc');

    const resp = await axios.get(listUrl.toString(), config);
    const listData = resp.data;
    if (!listData || !listData.records) {
      throw new Error('No data returned from Airtable');
    }

    let cursor: string | undefined = undefined;
    let grantApplications = await prisma.grantApplication.findMany({
      take: 10,
      include: {
        user: true,
        grant: true,
      },
    });

    if (grantApplications.length === 0) {
      res.status(200).json({ message: 'Airtable already up-to-date' });
      return;
    }

    const grantApplicationsAirtable: {
      fields: GrantApplicationAirtableSchema;
    }[] = [];

    for (const grantApplication of grantApplications) {
      grantApplicationsAirtable.push({
        fields: convertGrantApplicationToAirtable(grantApplication),
      });
    }

    const data = airtableUpsert(
      'earnGrantApplicationId',
      grantApplicationsAirtable,
    );

    console.log('Airtable Upsert Data:', JSON.stringify(data, null, 2));

    await axios.patch(url, JSON.stringify(data), config);

    do {
      cursor = grantApplications[9]?.id ?? undefined;
      if (!cursor) break;
      grantApplications = await prisma.grantApplication.findMany({
        take: 10,
        skip: 1,
        cursor: { id: cursor },
        include: {
          user: true,
          grant: true,
        },
      });

      const grantApplicationsAirtable: {
        fields: GrantApplicationAirtableSchema;
      }[] = [];
      for (const grantApplication of grantApplications) {
        grantApplicationsAirtable.push({
          fields: convertGrantApplicationToAirtable(grantApplication),
        });
      }

      const data = airtableUpsert(
        'earnGrantApplicationId',
        grantApplicationsAirtable,
      );

      console.log('Airtable Upsert Data:', JSON.stringify(data, null, 2));

      await axios.patch(url, JSON.stringify(data), config);
    } while (cursor);

    res.status(200).json({ message: 'Airtable Synced successfully' });
  } catch (error: any) {
    console.error('Error syncing Airtable:', error);
    if (error?.response?.data)
      console.error('Airtable Error', error.response.data);
    res
      .status(500)
      .json({ message: 'An error occurred while syncing with Airtable.' });
  }
}

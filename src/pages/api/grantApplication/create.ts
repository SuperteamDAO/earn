import axios from 'axios';
import dayjs from 'dayjs';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
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

async function grantApplication(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  const userId = req.userId;

  const {
    grantId,
    projectTitle,
    projectOneLiner,
    projectDetails,
    projectTimeline,
    proofOfWork,
    milestones,
    kpi,
    walletAddress,
    ask,
  } = req.body;

  const formattedProjectTimeline = dayjs(projectTimeline).format('D MMMM YYYY');

  try {
    const result = await prisma.grantApplication.create({
      data: {
        userId: userId as string,
        grantId,
        projectTitle,
        projectOneLiner,
        projectDetails,
        projectTimeline: formattedProjectTimeline,
        proofOfWork,
        milestones,
        kpi,
        walletAddress,
        ask,
      },
      include: {
        user: true,
        grant: true,
      },
    });

    const config = airtableConfig(process.env.AIRTABLE_GRANTS_API_TOKEN!);
    const url = airtableUrl(
      process.env.AIRTABLE_GRANTS_BASE_ID!,
      process.env.AIRTABLE_GRANTS_TABLE_NAME!,
    );

    const airtableData = convertGrantApplicationToAirtable(
      result as GrantApplicationWithUserAndGrant,
    );
    const airtablePayload = airtableUpsert('earnGrantApplicationId', [
      { fields: airtableData },
    ]);

    await axios.patch(url, JSON.stringify(airtablePayload), config);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`User ${userId} unable to apply`, error.message);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new grant application.',
    });
  }
}

export default withAuth(grantApplication);

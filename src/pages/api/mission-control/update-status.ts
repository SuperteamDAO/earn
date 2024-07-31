import { type NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import {
  airtableUrlMaker,
  decideAirtableStatusFromType,
  earnStatusFromStatus,
  fetchAirtable,
  type STATUS,
  type TSXTYPE,
  updateAirtable,
} from '@/features/mission-control';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import promiser from '@/utils/promiser';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  if (req.method !== 'POST') {
    logger.warn('Method not allowed');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const userId = req.userId;
  console.log('userId - ', userId);
  const [user, userError] = await promiser(
    prisma.user.findUnique({
      where: {
        id: userId as string,
      },
      select: {
        id: true,
        misconRole: true,
      },
    }),
  );

  if (userError) {
    logger.warn('Could not find user');
    return res.status(500).json({ message: 'Could not find user' });
  }

  if (!user?.misconRole) {
    logger.warn('Unauthorized');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id, sourceId, type, status, approvedAmount, earnId } = req.body as {
    id: string;
    sourceId: string;
    type: TSXTYPE;
    status: STATUS;
    approvedAmount?: string;
    earnId?: string;
  };
  if (!id || !type || !status) {
    logger.warn('Missing required fields');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const airtableUrl = airtableUrlMaker({
    fields: ['Region'],
    sortField: 'Application Time',
    sortDirection: 'desc',
  });

  const [reqRecord, reqError] = await promiser(
    fetchAirtable({
      id: id,
      pageSize: 1,
      airtableUrl,
    }),
  );
  if (reqError) {
    logger.warn(`Requested record of id ${id} does not exist`);
    return res.status(404).json({ message: 'Requested record not found' });
  }
  const currentRecord = reqRecord.data[0];
  if (
    user.misconRole !== 'ZEUS' &&
    currentRecord?.region?.toLowerCase() !== user.misconRole.toLowerCase()
  ) {
    logger.warn('Unauthorized');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  let tableId: string | undefined,
    baseId: string | undefined,
    token: string | undefined;
  if (type === 'grants') {
    baseId = process.env.AIRTABLE_INSTAGRANTS_BASE ?? '';
    tableId = process.env.AIRTABLE_INSTAGRANTS_TABLE ?? '';
    token = process.env.AIRTABLE_INSTAGRANTS_TOKEN ?? '';
  } else if (type === 'st-earn') {
    baseId = process.env.AIRTABLE_EARN_BASE ?? '';
    tableId = process.env.AIRTABLE_EARN_TABLE ?? '';
    token = process.env.AIRTABLE_EARN_TOKEN ?? '';
  } else if (type === 'miscellaneous') {
    baseId = process.env.AIRTABLE_LEADS_BASE ?? '';
    tableId = process.env.AIRTABLE_LEADS_TABLE ?? '';
    token = process.env.AIRTABLE_LEADS_TOKEN ?? '';
  }
  if (!tableId || !baseId) {
    logger.warn('Incorrect type asked');
    return res.status(400).json({ message: 'Incorrect type asked' });
  }

  const newStatus = decideAirtableStatusFromType(type, status);
  if (!newStatus) {
    logger.warn('Incorrect status asked');
    return res.status(400).json({ message: 'Incorrect status asked' });
  }

  const fields: any = {};
  fields['Status'] = decideAirtableStatusFromType(type, status);
  if (approvedAmount) {
    fields['Funding'] = Number(approvedAmount) ?? 0;
  }

  const [updateRes, updateError] = await promiser(
    updateAirtable({
      baseId,
      tableId,
      recordId: sourceId,
      fields: fields,
      token: token ?? '',
    }),
  );

  if (updateError) {
    logger.warn('Failed to update record');
    return res.status(500).json({ message: 'Failed to update record' });
  }

  if (updateRes?.records?.length === 0) {
    logger.warn('Record not found');
    return res.status(400).json({ message: 'Record not found' });
  }

  console.log('earnId - ', earnId);
  if (type === 'grants' && earnId && approvedAmount) {
    const [dbRes, dbError] = await promiser(
      prisma.grantApplication.update({
        where: {
          id: earnId,
        },
        data: {
          approvedAmount: Number(approvedAmount),
          applicationStatus: earnStatusFromStatus(status) ?? 'Pending',
        },
      }),
    );

    if (dbError) {
      logger.warn('Failed to update record in db');
      return res.status(400).json({ message: 'Failed to update record in db' });
    }

    if (dbRes.id) {
      logger.info(`Successfully updated db record with id=${dbRes?.id}`);
    }
  }

  logger.info(
    `Successfully updated status of record with id=${id} , type=${type} and status=${newStatus}`,
  );
  return res.status(200).json({ message: 'Success' });
}

export default withAuth(handler);

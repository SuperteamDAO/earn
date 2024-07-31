import { type NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import {
  fetchAirtable,
  getFetchAirtableURL,
  getFetchQueryProps,
  globalLead,
  type STATUS,
  superteamLists,
  type SuperteamOption,
  type TSXTYPE,
} from '@/features/mission-control';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import promiser from '@/utils/promiser';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  if (req.method !== 'GET') {
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
    console.log('Could not find user');
    logger.warn('Could not find user');
    return res.status(500).json({ message: 'Could not find user' });
  }

  if (!user?.misconRole) {
    logger.warn('Unauthorized');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const query = req.query;

  // const span: TIMEFRAME =
  //   ((query.span as string)?.trim() as TIMEFRAME) || 'allTime';
  const status: STATUS = ((query.status as string)?.trim() as STATUS) || 'all';
  const q: string = (query.q as string) || '';
  let region: string | null = (query.region as string) || 'global';
  const type: TSXTYPE = ((query.type as string)?.trim() as TSXTYPE) || 'all';
  const offset: string | undefined = (query.offset as string) ?? undefined;

  let selectedSuperteam: SuperteamOption;
  if (user.misconRole === 'ZEUS') {
    selectedSuperteam =
      superteamLists.find((s) => s.value === region) || globalLead;
  } else {
    region = null;
    const regionTeam = superteamLists.find(
      (s) => s.value.toLowerCase() === user?.misconRole?.toLowerCase(),
    );
    if (!regionTeam) {
      logger.warn('Incorrect Region');
      return res.status(401).json({ message: 'Incorrect Region' });
    } else {
      selectedSuperteam = regionTeam;
    }
  }

  const airtableUrl = getFetchAirtableURL();
  const [data, dataError] = await promiser(
    fetchAirtable(
      getFetchQueryProps(
        airtableUrl,
        selectedSuperteam,
        q,
        status,
        type,
        offset,
      ),
    ),
  );

  if (dataError) {
    logger.error(
      'Could not fetch transactions data from airtable - ',
      dataError,
    );
    return res
      .status(401)
      .json({ message: 'Could not fetch transactions data from airtable' });
  }

  logger.info(`Successfully fetched transactions data from airtable `);
  return res.status(200).json(data);
}

export default withAuth(handler);

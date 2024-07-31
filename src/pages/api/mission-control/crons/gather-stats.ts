import { type NextApiRequest, type NextApiResponse } from 'next';

import {
  airtableUrlMaker,
  fetchAirtable,
  type PaymentData,
  REDIS_PREFIX,
  type StatsData,
  type StatTypeData,
  type STATUS,
  type TIMEFRAME,
  type TSXTYPE,
} from '@/features/mission-control';
import logger from '@/lib/logger';
import { redis } from '@/redis';
import { dayjs } from '@/utils/dayjs';
import promiser from '@/utils/promiser';

async function buildStatsData(): Promise<StatsData> {
  const statsData: StatsData = {
    Global: {} as StatTypeData,
  };
  let offset: string | undefined = undefined;
  const pageSize = 100;
  do {
    const airtableUrl = airtableUrlMaker({
      fields: ['Region', 'Status', 'Sync Source', 'Amount', 'Application Time'],
      sortField: 'Application Time',
      sortDirection: 'desc',
    });
    // @ts-expect-error return type will always match but typescript doesn't know
    const [reqRecords, reqError] = await promiser<
      | {
          data: PaymentData[];
          nextOffset: string | null;
        }
      | undefined
    >(
      fetchAirtable({
        pageSize,
        airtableUrl,
        offset,
      }),
    );
    if (reqError) {
      logger.error('Error fetching Airtable data:', reqError);
      throw reqError;
    }
    if (reqRecords?.data) {
      reqRecords.data.forEach((record) => {
        processRecord(record, statsData);
        processRecord(record, statsData, 'Global');
      });
      offset = reqRecords.nextOffset ?? undefined;
    } else {
      offset = undefined;
    }
  } while (offset);

  // Calculate 'all' type for each region
  for (const region of Object.keys(statsData)) {
    calculateAllType(statsData[region]!);
  }

  return statsData;
}

function processRecord(
  record: PaymentData,
  statsData: StatsData,
  region: string = record.region ?? 'Unknown',
): void {
  const type = (record.type ?? 'miscellaneous') as TSXTYPE;
  const status = (record.status ?? 'undecided') as STATUS;
  const amount = record.amount ?? 0;
  const date = dayjs(record.date);

  if (!statsData[region]) {
    statsData[region] = {} as StatTypeData;
  }
  if (!statsData[region]![type]) {
    statsData[region]![type] = {
      timespan: {} as StatTypeData[TSXTYPE]['timespan'],
      approvedMonthly: {},
    };
  }
  const typeData = statsData[region]![type];

  (['allTime', 'yearToDate', 'last30days', 'last7days'] as TIMEFRAME[]).forEach(
    (span) => {
      if (!typeData.timespan[span]) {
        typeData.timespan[span] = {
          totalPaidAmount: 0,
          totalPendingAmount: 0,
          totalPendingRequests: 0,
          acceptedPercentage: 0,
        };
      }
      const timespanData = typeData.timespan[span];
      if (isWithinTimespan(date, span)) {
        if (status === 'accepted') {
          timespanData.totalPaidAmount += amount;
        } else if (status === 'undecided') {
          timespanData.totalPendingAmount += amount;
          timespanData.totalPendingRequests++;
        }

        const totalRequests =
          timespanData.totalPendingRequests +
          (timespanData.totalPaidAmount > 0 ? 1 : 0);
        timespanData.acceptedPercentage =
          totalRequests > 0
            ? (timespanData.totalPaidAmount > 0 ? 1 : 0) / totalRequests
            : 0;
      }
    },
  );

  if (status === 'accepted') {
    const monthYear = `${date.format('YYYY-MM')}`;
    typeData.approvedMonthly[monthYear] =
      (typeData.approvedMonthly[monthYear] || 0) + amount;
  }
}

function calculateAllType(regionData: StatTypeData): void {
  regionData.all = {
    timespan: {} as StatTypeData[TSXTYPE]['timespan'],
    approvedMonthly: {},
  };

  const types: TSXTYPE[] = ['grants', 'st-earn', 'miscellaneous'];

  (['allTime', 'yearToDate', 'last30days', 'last7days'] as TIMEFRAME[]).forEach(
    (span) => {
      regionData.all.timespan[span] = {
        totalPaidAmount: 0,
        totalPendingAmount: 0,
        totalPendingRequests: 0,
        acceptedPercentage: 0,
      };

      let totalAcceptedRequests = 0;
      let totalRequests = 0;

      types.forEach((type) => {
        if (regionData[type] && regionData[type].timespan[span]) {
          const typeData = regionData[type].timespan[span];
          regionData.all.timespan[span].totalPaidAmount +=
            typeData.totalPaidAmount;
          regionData.all.timespan[span].totalPendingAmount +=
            typeData.totalPendingAmount;
          regionData.all.timespan[span].totalPendingRequests +=
            typeData.totalPendingRequests;

          totalAcceptedRequests += typeData.totalPaidAmount > 0 ? 1 : 0;
          totalRequests +=
            typeData.totalPendingRequests +
            (typeData.totalPaidAmount > 0 ? 1 : 0);
        }
      });

      regionData.all.timespan[span].acceptedPercentage =
        totalRequests > 0 ? totalAcceptedRequests / totalRequests : 0;
    },
  );

  // Merge approvedMonthly data
  types.forEach((type) => {
    if (regionData[type]) {
      Object.entries(regionData[type].approvedMonthly).forEach(
        ([monthYear, amount]) => {
          regionData.all.approvedMonthly[monthYear] =
            (regionData.all.approvedMonthly[monthYear] || 0) + amount;
        },
      );
    }
  });
}

function isWithinTimespan(date: dayjs.Dayjs, span: TIMEFRAME): boolean {
  const now = dayjs();
  switch (span) {
    case 'allTime':
      return true;
    case 'yearToDate':
      return date.year() === now.year();
    case 'last30days':
      return date.isAfter(now.subtract(30, 'day'));
    case 'last7days':
      return date.isAfter(now.subtract(7, 'day'));
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    logger.warn('Method not allowed');
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  try {
    const statsData = await buildStatsData();
    res.status(200).json(statsData);

    for (const [region, data] of Object.entries(statsData)) {
      await redis.set(
        `${REDIS_PREFIX}:${region.toLowerCase()}`,
        JSON.stringify(data),
      );
    }
  } catch (error) {
    logger.error('Error building stats data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export default handler;

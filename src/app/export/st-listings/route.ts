import { NextResponse } from 'next/server';
import { unparse } from 'papaparse';

import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';

export async function GET() {
  try {
    const listings = await prisma.bounties.findMany({
      where: {
        sponsor: {
          st: true,
        },
        isPublished: true,
      },
      include: {
        sponsor: true,
        poc: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    console.log(`Found ${listings.length} listings`);

    const formatDate = (date: Date | null) => {
      if (!date) return '';
      return dayjs(date).format('DD-MM-YYYY');
    };

    const csvData = listings.map((item) => ({
      'Listing title': item.title || '',
      Sponsor: item.sponsor?.name || '',
      'Listing type': item.type?.toLowerCase() || '',
      'Geo-lock': item.region || 'GLOBAL',
      Reward:
        item.compensationType === 'variable'
          ? `Variable ${item.token}`
          : item.compensationType === 'range'
            ? `${item.minRewardAsk} ${item.token} to ${item.maxRewardAsk} ${item.token}`
            : item.rewardAmount
              ? `${item.rewardAmount} ${item.token}`
              : '',
      'Reward USD value': item.usdValue?.toFixed(2) || '',
      'Published Date': formatDate(item.publishedAt),
      Deadline: formatDate(item.deadline),
      'Winners announced?': item.isWinnersAnnounced ? 'Yes' : 'No',
      'Is Fndn Paying?': item.isFndnPaying ? 'Yes' : 'No',
      'Added By': [item.poc?.firstName, item.poc?.lastName]
        .filter(Boolean)
        .join(' '),
    }));

    console.log('First row sample:', csvData[0]);

    const csv = unparse(csvData);

    const today = dayjs().format('DD-MM-YYYY');
    const headers = {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=superteam-listings-${today}.csv`,
    };

    return new NextResponse(csv, { headers });
  } catch (error) {
    console.error('Error generating CSV:', error);
    return new NextResponse('Error generating CSV', { status: 500 });
  }
}

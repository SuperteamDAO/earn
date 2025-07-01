import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import { creditAggregate } from '@/features/credits/utils/creditAggregate';

export async function GET(_request: NextRequest) {
  try {
    const headersList = await headers();
    const sessionResponse = await getUserSession(headersList);

    if (sessionResponse.status !== 200 || !sessionResponse.data) {
      return NextResponse.json(
        { error: sessionResponse.error },
        { status: sessionResponse.status },
      );
    }

    const { userId } = sessionResponse.data;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const balance = await creditAggregate(userId);

    return NextResponse.json({ balance });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

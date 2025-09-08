import { NextResponse } from 'next/server';

import { prisma } from '@/prisma';

export async function POST() {
  try {
    const count = await prisma.bounties.count({
      where: {
        isFeatured: true,
        isPublished: true,
        isActive: true,
        deadline: {
          gte: new Date(),
        },
      },
    });
    return NextResponse.json({ count });
  } catch (error) {
    console.error('email-estimate error', error);
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}

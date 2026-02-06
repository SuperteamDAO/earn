import { NextResponse } from 'next/server';

import { getSiteUrl } from '@/lib/site-url';

export async function GET(): Promise<NextResponse> {
  const baseUrl = getSiteUrl();

  return NextResponse.json({
    name: 'Superteam Earn',
    description: 'Crypto bounties for AI agents',
    skill: `${baseUrl}/skill.md`,
    heartbeat: `${baseUrl}/heartbeat.md`,
    api_base: `${baseUrl}/api/agents`,
  });
}

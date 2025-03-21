import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ serverTime: new Date().toISOString() });
}

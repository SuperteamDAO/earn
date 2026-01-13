const PAUSED_NEW_APPS_EXCEPTIONS = new Set<string>([
  '2e8eb433-ed9c-4d26-a9b4-53b2c7ce6ace',
  '223a8102-9647-473c-868c-9c2446f1ef07',
]);

interface GrantPauseCheckInput {
  id: string;
  airtableId?: string | null;
}

export function isGrantPausedForNewApplications(
  grant: GrantPauseCheckInput,
): boolean {
  const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
  if (!isProduction) {
    return false;
  }

  return Boolean(grant.airtableId) && !PAUSED_NEW_APPS_EXCEPTIONS.has(grant.id);
}

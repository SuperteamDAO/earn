import { dayjs } from '@/utils/dayjs';

interface GetPayoutCopyParams {
  winnerAnnouncedAt: string | undefined;
  kycVerifiedAt?: string | null;
  now?: string;
}

const MONDAY_INDEX = 1; // Sunday=0, Monday=1
const CUTOFF_HOUR_UTC = 12; // 12:00 UTC

function getRefTimestamp(params: GetPayoutCopyParams): dayjs.Dayjs {
  const { winnerAnnouncedAt, kycVerifiedAt, now } = params;

  const nowUtc = dayjs.utc(now ?? undefined);
  const announced = winnerAnnouncedAt ? dayjs.utc(winnerAnnouncedAt) : null;
  const kyc = kycVerifiedAt ? dayjs.utc(kycVerifiedAt) : null;

  const candidateA = announced ?? nowUtc;
  const candidateB = kyc ?? nowUtc;
  return dayjs.max(candidateA, candidateB);
}

function startOfWeekUtc(d: dayjs.Dayjs): dayjs.Dayjs {
  // Week starts Sunday 00:00 UTC
  return d.startOf('week');
}

function mondayNoonUtcOfWeek(d: dayjs.Dayjs): dayjs.Dayjs {
  const weekStart = startOfWeekUtc(d);
  return weekStart
    .add(MONDAY_INDEX, 'day')
    .hour(CUTOFF_HOUR_UTC)
    .minute(0)
    .second(0)
    .millisecond(0);
}

function fridayUtcOfWeek(d: dayjs.Dayjs): dayjs.Dayjs {
  const weekStart = startOfWeekUtc(d);
  // Friday date at 00:00 (date-only display)
  return weekStart.add(5, 'day').startOf('day');
}

function computePayoutDateUtc(params: GetPayoutCopyParams): dayjs.Dayjs {
  const ref = getRefTimestamp(params);
  const cutoff = mondayNoonUtcOfWeek(ref);

  if (ref.isSame(cutoff) || ref.isBefore(cutoff)) {
    return fridayUtcOfWeek(ref);
  }
  return fridayUtcOfWeek(ref.add(1, 'week'));
}

function formatPayoutDate(d: dayjs.Dayjs): string {
  const currentYear = dayjs.utc().year();
  const base = d.format('Do MMM');
  return d.year() === currentYear ? base : `${base} ${d.year()}`;
}

export function getPayoutCopy(params: GetPayoutCopyParams): string {
  const payoutDate = computePayoutDateUtc(params);
  return `Will be paid by ${formatPayoutDate(payoutDate)}`;
}

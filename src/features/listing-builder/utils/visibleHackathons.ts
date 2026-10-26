import { dayjs } from '@/utils/dayjs';

interface Dated {
  startDate: string | Date | null;
  deadline: string | Date | null;
}

// Hackathons open for tracks: from a month before they start until two
// weeks before their deadline, earliest first (Earn's getVisibleHackathons).
export function getVisibleHackathons<H extends Dated>(hackathons?: H[]) {
  return (hackathons ?? [])
    .filter((hackathon) => {
      if (!hackathon.startDate || !hackathon.deadline) return false;

      const now = dayjs.utc();
      const startsShowingAt = dayjs
        .utc(hackathon.startDate)
        .subtract(1, 'month');
      const stopsShowingAt = dayjs.utc(hackathon.deadline).subtract(2, 'weeks');

      return now.isBetween(startsShowingAt, stopsShowingAt, null, '[]');
    })
    .toSorted(
      (a, b) =>
        dayjs.utc(a.startDate).valueOf() - dayjs.utc(b.startDate).valueOf(),
    );
}

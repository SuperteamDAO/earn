import { type HackathonModel } from '@/prisma/models/Hackathon';
import { dayjs } from '@/utils/dayjs';

export function getVisibleHackathons(hackathons?: HackathonModel[]) {
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
    .sort((a, b) => {
      return (
        dayjs.utc(a.startDate).valueOf() - dayjs.utc(b.startDate).valueOf()
      );
    });
}

import { dayjs } from '@/utils/dayjs';

export const timeAgoShort = (date: Date | string): string => {
  const now = dayjs();
  const then = dayjs(date);

  const diffInMinutes = Math.abs(then.diff(now, 'minute'));
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.abs(then.diff(now, 'hour'));
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.abs(then.diff(now, 'day'));
  if (diffInDays <= 30) {
    return `${diffInDays}d`;
  }

  const diffInMonths = Math.abs(then.diff(now, 'month'));
  if (diffInMonths < 12) {
    return `${diffInMonths}mo`;
  }

  const diffInYears = Math.abs(then.diff(now, 'year'));
  return `${diffInYears}y`;
};

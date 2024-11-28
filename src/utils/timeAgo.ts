import { dayjs } from '@/utils/dayjs';

export const timeAgoShort = (date: Date | string): string => {
  const now = dayjs();
  const then = dayjs(date);

  const diffInMinutes = Math.abs(then.diff(now, 'minute'));
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟`;
  }

  const diffInHours = Math.abs(then.diff(now, 'hour'));
  if (diffInHours < 24) {
    return `${diffInHours}小时`;
  }

  const diffInDays = Math.abs(then.diff(now, 'day'));
  if (diffInDays <= 30) {
    return `${diffInDays}天`;
  }

  const diffInMonths = Math.abs(then.diff(now, 'month'));
  if (diffInMonths < 12) {
    return `${diffInMonths}个月`;
  }

  const diffInYears = Math.abs(then.diff(now, 'year'));
  return `${diffInYears}年`;
};

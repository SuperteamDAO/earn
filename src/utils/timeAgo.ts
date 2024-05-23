import moment from 'moment';

export const timeAgoShort = (date: Date | string): string => {
  const now = moment();
  const then = moment(date);

  const diffInMinutes = Math.abs(then.diff(now, 'minutes'));
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.abs(then.diff(now, 'hours'));
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.abs(then.diff(now, 'days'));
  if (diffInDays < 30) {
    return `${diffInDays}d`;
  }

  const diffInMonths = Math.abs(then.diff(now, 'months'));
  if (diffInMonths < 12) {
    return `${diffInMonths}mo`;
  }

  const diffInYears = Math.abs(then.diff(now, 'years'));
  return `${diffInYears}y`;
};

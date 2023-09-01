import moment from 'moment';

export const timeAgoShort = (date: Date | string): string => {
  const now = moment();
  const then = moment(date);
  const diffInMinutes = now.diff(then, 'minutes');

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = now.diff(then, 'hours');
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = now.diff(then, 'days');
  if (diffInDays < 30) {
    return `${diffInDays}d ago`;
  }

  const diffInMonths = now.diff(then, 'months');
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = now.diff(then, 'years');
  return `${diffInYears}y ago`;
};

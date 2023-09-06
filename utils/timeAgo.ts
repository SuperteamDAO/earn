import moment from 'moment';

export const timeAgoShort = (date: Date | string): string => {
  const now = moment();
  const then = moment(date);
  const diffInMinutes = now.diff(then, 'minutes');

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = now.diff(then, 'hours');
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = now.diff(then, 'days');
  if (diffInDays < 30) {
    return `${diffInDays}d`;
  }

  const diffInMonths = now.diff(then, 'months');
  if (diffInMonths < 12) {
    return `${diffInMonths}mo`;
  }

  const diffInYears = now.diff(then, 'years');
  return `${diffInYears}y`;
};

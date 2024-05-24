import dayjs from 'dayjs';
import QuarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(QuarterOfYear);

const FORMAT = 'YYYY-MM-DD';

export function firstDayOfYear(): [string] {
  return [dayjs().startOf('year').format(FORMAT)];
}

export function lastThirtyDays(): [string, string] {
  const today = dayjs().add(1, 'day').format(FORMAT);
  const thirtyDaysAgo = dayjs().subtract(30, 'day').format(FORMAT);

  return [thirtyDaysAgo, today];
}

export function lastSevenDays(): [string, string] {
  const today = dayjs().add(1, 'day').format(FORMAT);
  const sevenDaysAgo = dayjs().subtract(7, 'day').format(FORMAT);

  return [sevenDaysAgo, today];
}

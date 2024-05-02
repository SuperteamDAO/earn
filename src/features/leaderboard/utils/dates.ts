import dayjs from 'dayjs';
import QuarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(QuarterOfYear);

const FORMAT = 'YYYY-MM-DD';

export function firstDayOfYear(): string {
  return dayjs().startOf('year').format(FORMAT);
}

export function firstAndLastDayOfLastYear(): string[] {
  const firstDayOfLastYear = dayjs()
    .subtract(1, 'year')
    .startOf('year')
    .format(FORMAT);
  const lastDayOfLastYear = dayjs()
    .subtract(1, 'year')
    .endOf('year')
    .format(FORMAT);
  return [firstDayOfLastYear, lastDayOfLastYear];
}

export function firstAndLastDayOfLastMonth(): string[] {
  const firstDayOfLastMonth = dayjs()
    .subtract(1, 'month')
    .startOf('month')
    .format(FORMAT);
  const lastDayOfLastMonth = dayjs()
    .subtract(1, 'month')
    .endOf('month')
    .format(FORMAT);
  return [firstDayOfLastMonth, lastDayOfLastMonth];
}

export function firstAndLastDayOfLastQuarter(): string[] {
  const firstDayOfLastQuarter = dayjs()
    .subtract(1, 'quarter')
    .startOf('quarter')
    .format(FORMAT);
  const lastDayOfLastQuarter = dayjs()
    .subtract(1, 'quarter')
    .endOf('quarter')
    .format(FORMAT);
  return [firstDayOfLastQuarter, lastDayOfLastQuarter];
}

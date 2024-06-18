import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';
import isToday from 'dayjs/plugin/isToday';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import minMax from 'dayjs/plugin/minMax';
import relativeTime from 'dayjs/plugin/relativeTime';
import timeZone from 'dayjs/plugin/timezone';
import toArray from 'dayjs/plugin/toArray';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(isToday);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(timeZone);
dayjs.extend(toArray);
dayjs.extend(utc);
dayjs.extend(minMax);
dayjs.extend(duration);
dayjs.extend(updateLocale);

export { dayjs };

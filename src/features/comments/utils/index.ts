export function formatFromNow(now: string) {
  return now
    .replace('a few seconds', '1s')
    .replace('a minute', '1m')
    .replace(' minutes', 'm')
    .replace('an hour', '1h')
    .replace(' hours', 'h')
    .replace('a day', '1d')
    .replace(' days', 'd')
    .replace('a month', '1M')
    .replace(' months', 'M')
    .replace('a year', '1y')
    .replace(' years', 'y');
}

export const CountDownRenderer = ({
  days,
  hours,
  minutes,
  seconds,
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}) => {
  if (days > 0) {
    return <span>{`${days}d:${hours}h:${minutes}m`}</span>;
  }
  return <span>{`${hours}h:${minutes}m:${seconds}s`}</span>;
};

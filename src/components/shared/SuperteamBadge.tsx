import { cn } from '@/utils/cn';

import SuperteamIcon from '../icons/SuperteamIcon';

export const SuperteamBadge = ({
  containerClassName,
  iconClassName,
  textClassName,
}: {
  containerClassName: string;
  iconClassName: string;
  textClassName: string;
}) => {
  return (
    <div
      className={cn(
        'flex w-fit items-center gap-1 rounded-full select-none',
        containerClassName,
      )}
    >
      <SuperteamIcon className={cn('size-3 text-zinc-500', iconClassName)} />
      <span className={cn('text-sm font-medium text-zinc-800', textClassName)}>
        Superteam
      </span>
    </div>
  );
};

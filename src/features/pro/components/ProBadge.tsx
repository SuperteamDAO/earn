import ProIcon from '@/components/icons/ProIcon';
import { cn } from '@/utils/cn';

export const ProBadge = ({
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
        'flex h-fit items-center justify-center rounded-full select-none',
        containerClassName,
      )}
    >
      <ProIcon className={iconClassName} />
      <p className={textClassName}>PRO</p>
    </div>
  );
};

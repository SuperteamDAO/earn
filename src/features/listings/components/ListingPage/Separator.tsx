import { cn } from '@/utils/cn';

export const ListingHeaderSeparator = ({
  className,
}: {
  className?: string;
}) => {
  return <span className={cn('font-medium text-[#E2E8EF]', className)}>|</span>;
};

import { cn } from '@/utils/cn';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-slate-300', className)}
      {...props}
    />
  );
}

export { Skeleton };

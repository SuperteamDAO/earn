import { cn } from '@/utils/cn';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('rounded-md bg-slate-200', className)}
      style={{ animation: 'var(--animate-skeleton-pulse)' }}
      {...props}
    />
  );
}

export { Skeleton };

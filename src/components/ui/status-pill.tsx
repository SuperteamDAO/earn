import { cn } from '@/utils/cn';

interface StatusPillProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly color: string;
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly onClick?: () => void;
}

export function StatusPill({
  children,
  className,
  color,
  backgroundColor,
  borderColor,
  onClick,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        'w-full items-center rounded-full border px-3 py-0.5 text-center text-xs whitespace-nowrap capitalize select-none',
        color,
        backgroundColor,
        borderColor,
        className,
      )}
      onClick={onClick}
    >
      {children}
    </span>
  );
}

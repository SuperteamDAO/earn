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
        'w-full items-center rounded-full border px-2 py-px text-center text-xs whitespace-nowrap capitalize transition-all duration-200 ease-linear select-none',
        color,
        backgroundColor,
        borderColor,
        className,
      )}
      onClick={onClick}
      // Not a <button>: that renders inline-block and would start honoring the
      // w-full above, which this inline span ignores, stretching the pill.
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </span>
  );
}

import { cn } from '@/utils/cn';

interface CreditIconProps {
  className?: string;
}

export const CreditIcon = ({ className }: CreditIconProps) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('h-4 w-4 stroke-[1.5px] text-white', className)}
  >
    <circle cx="8" cy="8" r="7" className="stroke-current" />
    <rect
      x="4.59961"
      y="7.9939"
      width="4.8"
      height="4.8"
      transform="rotate(-45 4.59961 7.9939)"
      fill="currentColor"
    />
  </svg>
);

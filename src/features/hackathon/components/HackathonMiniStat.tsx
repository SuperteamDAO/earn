import { Info } from 'lucide-react';
import { type ReactNode } from 'react';

import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';

interface HackathonMiniStatProps {
  title: string;
  children: ReactNode;
  className?: string;
  infotipContent?: string;
}

export const HackathonMiniStat = ({
  title,
  children,
  className,
  infotipContent,
}: HackathonMiniStatProps) => {
  return (
    <Tooltip
      content={infotipContent}
      contentProps={{
        className: 'w-3/4 md:w-auto',
      }}
      disabled={!infotipContent}
    >
      <div
        className={cn(
          'flex flex-col items-start gap-1 md:items-start',
          className,
        )}
      >
        <span className="flex items-center gap-2">
          <p className="text-left text-xs text-white/80 md:w-max md:text-sm">
            {title}
          </p>
          {infotipContent && <Info className="h-3 w-3 text-gray-400" />}
        </span>
        <p className="text-lg font-bold md:text-2xl">{children}</p>
      </div>
    </Tooltip>
  );
};

import React from 'react';

import { cn } from '@/utils/cn';

interface StatusBadgeProps {
  textColor: string;
  text: string;
  Icon: React.JSX.Element;
}

export const StatusBadge = ({ textColor, text, Icon }: StatusBadgeProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1 whitespace-nowrap rounded-full py-1 text-xs font-medium sm:text-sm',
        `text-${textColor}`,
      )}
      color={textColor}
    >
      {Icon}
      <p className="hidden sm:flex">{text}</p>
    </div>
  );
};

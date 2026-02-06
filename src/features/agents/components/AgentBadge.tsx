import { Bot } from 'lucide-react';

import { cn } from '@/utils/cn';

export const AgentBadge = ({
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
      <Bot className={iconClassName} />
      <p className={textClassName}>AGENT</p>
    </div>
  );
};

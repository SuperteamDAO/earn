import { AnimatedDots } from '@/components/shared/AnimatedDots';
import { cn } from '@/utils/cn';

import { type ProUpgradeFlowSource } from '@/features/pro/state/pro-upgrade-flow';

import { RandomArrow } from './RandomArrow';

interface ProIntroProps {
  readonly className?: string;
  readonly origin: ProUpgradeFlowSource;
}

export const ProBG = ({ className }: ProIntroProps) => {
  return (
    <div
      className={cn(
        'pro-intro-container relative flex h-64 flex-col items-center justify-between overflow-hidden rounded-xl bg-black px-4 select-none',
        className,
      )}
    >
      <RandomArrow className="absolute top-10 left-0 scale-125 opacity-90" />

      <div className="absolute -top-30 right-0 size-96 rounded-full bg-white/20 blur-[120px]" />
      <div className="absolute -bottom-30 left-0 size-96 rounded-full bg-white/20 blur-[120px]" />

      <AnimatedDots
        dotSize={3}
        colors={['#a1a1aa']}
        columns={50}
        rows={6}
        spacing={1.5}
        className="z-10 mt-0.5 opacity-80 transition-colors duration-500"
      />
    </div>
  );
};

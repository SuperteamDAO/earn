import localFont from 'next/font/local';
import { useRef } from 'react';

import ProGradientIcon from '@/components/icons/ProGradientIcon';
import { AnimatedDots } from '@/components/shared/AnimatedDots';
import { cn } from '@/utils/cn';

import { type ProUpgradeFlowSource } from '@/features/pro/state/pro-upgrade-flow';

import { ProUpgradeButton } from './ProUpgradeButton';
import { RandomArrow } from './RandomArrow';

const font = localFont({
  src: '../../../../public/PerfectlyNineties.otf',
  variable: '--font-perfectly-nineties',
  preload: false,
});

interface ProIntroProps {
  readonly className?: string;
  readonly origin: ProUpgradeFlowSource;
}

export const ProIntro = ({ className, origin }: ProIntroProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <style>{`
        .pro-intro-container:has(button:hover) [style*="background-color"] {
          background-color: #C0C0C0 !important;
        }
        .pro-intro-container:has(button:hover) [style*="background-color"]:nth-child(8n+3) {
          background-color: #d4af37 !important;
        }
        .pro-intro-upgrade-button {
          will-change: transform;
          transform: scale(1);
          transform-origin: center center;
          -webkit-transform: scale(1);
          -webkit-transform-origin: center center;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          contain: style paint;
        }
        .pro-intro-upgrade-button:hover:not(:disabled) {
          transform: scale(1.02);
          -webkit-transform: scale(1.02);
        }
        .pro-intro-upgrade-button:disabled:hover {
          transform: scale(1);
          -webkit-transform: scale(1);
        }
      `}</style>
      <div
        ref={containerRef}
        className={cn(
          'pro-intro-container relative flex h-64 flex-col items-center justify-between overflow-hidden rounded-xl bg-black px-4 select-none',
          font.className,
          className,
        )}
      >
        <RandomArrow className="absolute top-10 left-0 opacity-60" />
        <div className="absolute -top-10 -left-10 size-64 rounded-full bg-white/20 blur-[60px]" />

        <AnimatedDots
          dotSize={3}
          colors={['#a1a1aa']}
          columns={50}
          rows={6}
          spacing={1.5}
          className="z-10 mt-0.5 opacity-80 transition-colors duration-500"
        />
        <div className="relative z-10 flex flex-col items-center justify-center">
          <ProGradientIcon className="size-6" />
          <p className="mt-4 text-center text-3xl text-white">
            A premium <br /> experience awaits
          </p>
        </div>
        <ProUpgradeButton
          origin={origin}
          containerRef={containerRef}
          className="pro-intro-upgrade-button mt-5 mb-4 w-full"
        />
      </div>
    </>
  );
};

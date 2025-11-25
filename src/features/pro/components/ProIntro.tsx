import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import localFont from 'next/font/local';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import ProGradientIcon from '@/components/icons/ProGradientIcon';
import { AnimatedDots } from '@/components/shared/AnimatedDots';
import { Button } from '@/components/ui/button';
import type { User } from '@/interface/user';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import {
  type ProUpgradeFlowSource,
  type ProUpgradeOriginRect,
  type ProUpgradeViewport,
  useProUpgradeFlow,
} from '@/features/pro/state/pro-upgrade-flow';

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

const getFallbackRect = (
  viewport: ProUpgradeViewport,
): ProUpgradeOriginRect => ({
  left: viewport.width / 2,
  top: viewport.height / 2,
  width: 0,
  height: 0,
});

const snapshotRect = (rect: DOMRect): ProUpgradeOriginRect => ({
  left: rect.left,
  top: rect.top,
  width: rect.width,
  height: rect.height,
});

export const ProIntro = ({ className, origin }: ProIntroProps) => {
  const { refetchUser } = useUser();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { flow, start, triggerExpansion, reset } = useProUpgradeFlow();
  const isOriginActive = flow.source === origin && flow.status !== 'idle';
  const isOtherFlowActive =
    flow.source !== null && flow.source !== origin && flow.status !== 'idle';

  const handleUpgrade = async () => {
    if (isLoading || isOtherFlowActive) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const rect = containerRef.current?.getBoundingClientRect();

    start({
      source: origin,
      originRect: rect ? snapshotRect(rect) : getFallbackRect(viewport),
      viewport,
    });

    try {
      setIsLoading(true);
      const { data: updatedUser } = await api.post<User>(
        '/api/user/pro/upgrade',
      );

      if (updatedUser) {
        queryClient.setQueryData(['user'], updatedUser);
        await refetchUser();
      }
      triggerExpansion();
    } catch (error) {
      reset();
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to upgrade to Pro. Please try again.';
        toast.error(errorMessage);
      } else {
        toast.error('Failed to upgrade to Pro. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .pro-intro-container:has(button:hover) [style*="background-color"] {
          background-color: #C0C0C0 !important;
        }
        .pro-intro-container:has(button:hover) [style*="background-color"]:nth-child(8n+3) {
          background-color: #d4af37 !important;
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
        <Button
          onClick={handleUpgrade}
          disabled={isLoading || isOriginActive}
          className="group relative z-10 mt-5 mb-4 w-full overflow-hidden rounded-lg bg-linear-to-b from-[#575656] to-[#5B5959] font-sans transition-all duration-500 ease-out hover:scale-[1.02] hover:from-[#7A7A7A] hover:to-[#5A5A5A] hover:shadow-[0_0_20px_rgba(192,192,192,0.3),inset_0_0_20px_rgba(128,128,128,0.1)] focus:ring-0 focus:outline-hidden focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          <span className="relative z-10">
            {isLoading ? 'Upgrading...' : 'Upgrade'}
          </span>
          <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
        </Button>
      </div>
    </>
  );
};

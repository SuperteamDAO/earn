import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import posthog from 'posthog-js';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

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

interface ProUpgradeButtonProps {
  readonly origin: ProUpgradeFlowSource;
  readonly className?: string;
  readonly children?: React.ReactNode;
  readonly containerRef?:
    | React.RefObject<HTMLElement | null>
    | React.RefObject<HTMLDivElement | null>;
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

export const ProUpgradeButton = ({
  origin,
  className,
  children,
  containerRef: externalContainerRef,
}: ProUpgradeButtonProps) => {
  const { refetchUser } = useUser();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const internalContainerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = externalContainerRef ?? internalContainerRef;
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

    posthog.capture('upgrade pro');

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const rect = containerRef?.current?.getBoundingClientRect() ?? null;

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
    <Button
      ref={internalContainerRef}
      onClick={handleUpgrade}
      disabled={isLoading || isOriginActive}
      className={cn(
        'pro-intro-upgrade-button group relative z-10 overflow-hidden rounded-lg bg-linear-to-b from-[#575656] to-[#5B5959] font-sans transition-all duration-500 ease-out hover:from-[#7A7A7A] hover:to-[#5A5A5A] hover:shadow-[0_0_20px_rgba(192,192,192,0.3),inset_0_0_20px_rgba(128,128,128,0.1)] focus:ring-0 focus:outline-hidden focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      <span className="relative z-10">
        {children ?? (isLoading ? 'Upgrading...' : 'Upgrade')}
      </span>
      <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
    </Button>
  );
};

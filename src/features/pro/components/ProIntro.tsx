import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import localFont from 'next/font/local';
import { useState } from 'react';
import { toast } from 'sonner';

import ProGradientIcon from '@/components/icons/ProGradientIcon';
import { AnimatedDots } from '@/components/shared/AnimatedDots';
import { Button } from '@/components/ui/button';
import type { User } from '@/interface/user';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { RandomArrow } from './RandomArrow';

const font = localFont({
  src: '../../../../public/PerfectlyNineties.otf',
  variable: '--font-perfectly-nineties',
  preload: false,
});

export const ProIntro = ({ className }: { className?: string }) => {
  const { refetchUser } = useUser();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const { data: updatedUser } = await api.post<User>(
        '/api/user/pro/upgrade',
      );

      if (updatedUser) {
        queryClient.setQueryData(['user'], updatedUser);
        await refetchUser();
      }
    } catch (error) {
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
        .pro-intro-container:has(button:hover) [style*="background-color"]:nth-child(15n+3) {
          background-color: #d4af37 !important;
        }
      `}</style>
      <div
        className={cn(
          'pro-intro-container relative flex h-64 flex-col items-center justify-between overflow-hidden rounded-xl bg-black px-4 select-none',
          font.className,
          className,
        )}
      >
        <RandomArrow className="absolute top-10 left-0 opacity-60" />
        <div className="absolute -top-10 -left-10 size-64 rounded-full bg-white/20 blur-[60px]" />

        <AnimatedDots
          dotSize={4}
          colors={['#a1a1aa']}
          columns={30}
          rows={4}
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
          disabled={isLoading}
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

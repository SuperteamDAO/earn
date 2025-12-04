import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useUpdateUser, useUser } from '@/store/user';

interface UseAutoSwitchSponsorOptions {
  error: unknown;
  refetch: () => void;
  queryKey?: string[];
}

export function useAutoSwitchSponsor({
  error,
  refetch,
  queryKey,
}: UseAutoSwitchSponsorOptions) {
  const { user } = useUser();
  const updateUser = useUpdateUser();
  const queryClient = useQueryClient();
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const handleAutoSwitch = async () => {
      // Check if error is a 403 with sponsorId
      const axiosError = error as {
        response?: {
          status?: number;
          data?: {
            sponsorId?: string;
            message?: string;
          };
        };
      };

      if (
        axiosError?.response?.status === 403 &&
        axiosError?.response?.data?.sponsorId
      ) {
        // Only proceed if user is GOD mode (wait for user to load)
        if (!user || user?.role !== 'GOD') {
          return;
        }

        const sponsorId = axiosError.response.data.sponsorId;

        // Don't switch if already switching or if already on this sponsor
        if (isSwitching || user.currentSponsorId === sponsorId) {
          return;
        }

        // Cancel any pending queries immediately to prevent retries
        if (queryKey) {
          queryClient.cancelQueries({ queryKey });
        }

        setIsSwitching(true);

        // Show toast immediately (synchronously)
        toast.loading('Incorrect sponsor, switching to correct one', {
          id: 'sponsor-switch',
        });

        // Use requestAnimationFrame to ensure toast is rendered before async operation
        requestAnimationFrame(async () => {
          const startTime = Date.now();
          const minDelay = 3000; // 3 seconds minimum delay

          try {
            // Switch sponsor
            await updateUser.mutateAsync({ currentSponsorId: sponsorId });

            // Calculate remaining time to ensure minimum 3 seconds of loading toast
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minDelay - elapsedTime);

            // Wait for remaining time if needed
            if (remainingTime > 0) {
              await new Promise((resolve) =>
                setTimeout(resolve, remainingTime),
              );
            }

            toast.success('Switched to the correct sponsor', {
              id: 'sponsor-switch',
            });

            // Invalidate relevant queries
            if (queryKey) {
              queryClient.invalidateQueries({ queryKey });
            }

            // Refetch the data
            refetch();
          } catch (switchError) {
            toast.error('Failed to switch sponsor', {
              id: 'sponsor-switch',
            });
            console.error('Failed to auto-switch sponsor:', switchError);
          } finally {
            setIsSwitching(false);
          }
        });
      }
    };

    handleAutoSwitch();
  }, [
    error,
    user?.role,
    user?.currentSponsorId,
    isSwitching,
    updateUser,
    refetch,
    queryClient,
    queryKey,
  ]);

  return { isSwitching };
}

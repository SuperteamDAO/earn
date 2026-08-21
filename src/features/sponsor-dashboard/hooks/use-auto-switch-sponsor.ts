import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useUpdateUser, useUser } from '@/store/user';

interface UseAutoSwitchSponsorOptions {
  error: unknown;
  refetch: () => void;
  queryKey?: string[];
}

export function useAutoSwitchSponsor({ error }: UseAutoSwitchSponsorOptions) {
  const { user } = useUser();
  const updateUser = useUpdateUser();
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
        if (!user) {
          return;
        }

        const sponsorId = axiosError.response.data.sponsorId;
        const canAccessSponsor =
          user.role === 'GOD' ||
          (user.UserSponsors ?? []).some(
            (membership) => membership.sponsorId === sponsorId,
          );

        if (!canAccessSponsor) {
          return;
        }

        // Don't switch if already switching or if already on this sponsor
        if (isSwitching || user.currentSponsorId === sponsorId) {
          return;
        }

        setIsSwitching(true);

        toast.loading('Incorrect sponsor, switching to correct one', {
          id: 'sponsor-switch',
        });

        let isReloading = false;

        try {
          await updateUser.mutateAsync({ currentSponsorId: sponsorId });

          toast.success('Switched to the correct sponsor', {
            id: 'sponsor-switch',
          });

          isReloading = true;
          window.location.reload();
        } catch (switchError) {
          toast.error('Failed to switch sponsor', {
            id: 'sponsor-switch',
          });
          console.error('Failed to auto-switch sponsor:', switchError);
        } finally {
          if (!isReloading) {
            setIsSwitching(false);
          }
        }
      }
    };

    handleAutoSwitch();
  }, [
    error,
    user,
    user?.role,
    user?.currentSponsorId,
    isSwitching,
    updateUser,
  ]);

  return { isSwitching };
}

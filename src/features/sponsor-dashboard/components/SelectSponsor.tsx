import { atom, useSetAtom } from 'jotai';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import type { SponsorType } from '@/interface/sponsor';
import { api } from '@/lib/api';
import { useUpdateUser, useUser } from '@/store/user';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

interface SponsorOptionType extends SponsorType {
  role?: string;
}

interface SponsorOption {
  value: string;
  label: string;
  sponsor: SponsorOptionType;
}

function getSponsorRoleLabel(sponsor?: SponsorOptionType) {
  return sponsor?.role ?? '';
}

export const hackathonSponsorAtom = atom<string | null>(null);

export function SelectSponsor({
  type,
  isExpanded = false,
}: {
  type?: string;
  isExpanded?: boolean;
}) {
  const { user } = useUser();
  const updateUser = useUpdateUser();
  const router = useRouter();

  const [selectedSponsor, setSelectedSponsor] = useState<SponsorOption | null>(
    null,
  );
  const setHackathonSponsor = useSetAtom(hackathonSponsorAtom);

  const currentSponsor = useMemo(() => {
    if (type === 'hackathon') {
      return selectedSponsor;
    }

    if (!user?.currentSponsor?.id) {
      return null;
    }

    return {
      value: user.currentSponsor.id,
      label: user.currentSponsor.name,
      sponsor: {
        ...user.currentSponsor,
        role: undefined,
      },
    };
  }, [selectedSponsor, type, user?.currentSponsor]);

  const loadSponsors = useCallback(async (inputValue: string) => {
    const response = await api.get(`/api/sponsors/list/`, {
      params: {
        searchString: inputValue,
      },
    });

    return [...(response?.data || [])] as SponsorOption[];
  }, []);

  const updateSponsor = async (sponsorId: string) => {
    try {
      await updateUser.mutateAsync({ currentSponsorId: sponsorId });
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = async (option: SponsorOption) => {
    if (type === 'hackathon') {
      setHackathonSponsor(option.value);
      setSelectedSponsor(option);
    } else {
      await updateSponsor(option.value);
      // Redirect god mode users to main sponsor dashboard if on any /dashboard/* page except /dashboard/listings
      if (
        user?.role === 'GOD' &&
        router.asPath.startsWith('/earn/dashboard/') &&
        router.asPath !== '/earn/dashboard/listings'
      ) {
        router.push('/earn/dashboard/listings/');
      }
    }
  };

  return (
    <AsyncCombobox
      value={currentSponsor}
      onChange={handleChange}
      placeholder="Select Sponsor"
      loadOptions={loadSponsors}
      isExpanded={isExpanded}
      renderValue={(option) => (
        <div className="flex items-center py-1">
          <EarnAvatar
            id={option.sponsor?.name}
            avatar={option.sponsor?.logo}
            className="h-6 w-6 rounded-sm"
          />
          <div className="ml-2 hidden md:block">
            <div className="flex">
              <p className="text-sm text-slate-800">{option.sponsor?.name}</p>
            </div>
            <p className="text-xs text-slate-400">
              {getSponsorRoleLabel(option.sponsor)}
            </p>
          </div>
        </div>
      )}
      renderOption={(option) => (
        <div className="flex items-center">
          <EarnAvatar
            id={option.sponsor?.name}
            avatar={option.sponsor?.logo}
            className="rounded-sm"
          />
          <div className="ml-2 hidden md:block">
            <div className="flex flex-wrap items-center">
              <p className="text-sm text-slate-800">{option.sponsor?.name}</p>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-xs text-slate-400">
                {getSponsorRoleLabel(option.sponsor)}
              </p>
              {option.sponsor?.isVerified && <VerifiedBadge />}
            </div>
          </div>
        </div>
      )}
      className="border-slate-300"
    />
  );
}

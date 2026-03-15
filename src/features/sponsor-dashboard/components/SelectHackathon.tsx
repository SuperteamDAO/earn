import { useSetAtom } from 'jotai';
import { useCallback, useMemo, useState } from 'react';

import { AsyncCombobox } from '@/components/ui/async-combobox';
import { api } from '@/lib/api';
import { useUpdateUser, useUser } from '@/store/user';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { hackathonSponsorAtom } from './SelectSponsor';

interface HackathonOptionType {
  id?: string;
  slug?: string;
  name: string;
  altLogo?: string | null;
  logo?: string | null;
  role?: string;
}

interface HackathonOption {
  value: string;
  label: string;
  hackathon: HackathonOptionType;
}

function getHackathonRoleLabel(hackathon?: HackathonOptionType) {
  return hackathon?.role ?? '';
}

export function SelectHackathon({
  type,
  isExpanded = false,
}: {
  type?: string;
  isExpanded?: boolean;
}) {
  const [selectedHackathon, setSelectedHackathon] =
    useState<HackathonOption | null>(null);
  const setHackathonSponsor = useSetAtom(hackathonSponsorAtom);

  const { user } = useUser();
  const updateUser = useUpdateUser();

  const currentHackathon = useMemo(() => {
    if (type === 'hackathon') {
      return selectedHackathon;
    }

    if (!user?.hackathonId || !user.Hackathon) {
      return null;
    }

    return {
      value: user.Hackathon.id,
      label: user.Hackathon.name,
      hackathon: {
        ...user.Hackathon,
        role: undefined,
      },
    };
  }, [selectedHackathon, type, user?.Hackathon, user?.hackathonId]);

  const loadHackathons = useCallback(async (inputValue: string) => {
    const response = await api.get(`/api/hackathon/list/`, {
      params: {
        searchString: inputValue,
      },
    });

    return [...(response?.data || [])] as HackathonOption[];
  }, []);

  const updateSponsor = async (hackathonId: string) => {
    try {
      await updateUser.mutateAsync({ hackathonId });
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = async (option: HackathonOption) => {
    if (type === 'hackathon') {
      setHackathonSponsor(option.value);
      setSelectedHackathon(option);
    } else {
      await updateSponsor(option.value);
    }
  };

  return (
    <AsyncCombobox
      value={currentHackathon}
      onChange={handleChange}
      placeholder="Select Hackathon"
      loadOptions={loadHackathons}
      isExpanded={isExpanded}
      renderValue={(option) => (
        <div className="flex items-center py-1">
          <EarnAvatar
            id={option.hackathon?.name}
            avatar={option.hackathon?.altLogo || undefined}
            className="h-6 w-6 rounded-sm"
          />
          <div className="ml-2 hidden md:block">
            <p className="text-sm text-slate-800">{option.hackathon?.name}</p>
            <p className="text-xs text-slate-400">
              {getHackathonRoleLabel(option.hackathon)}
            </p>
          </div>
        </div>
      )}
      renderOption={(option) => (
        <div className="flex items-center">
          <EarnAvatar
            className="rounded-sm"
            id={option.hackathon?.name}
            avatar={option.hackathon?.altLogo || undefined}
          />
          <div className="ml-2 hidden md:block">
            <p className="text-sm text-slate-800">{option.hackathon?.name}</p>
            <p className="text-xs text-slate-400">
              {getHackathonRoleLabel(option.hackathon)}
            </p>
          </div>
        </div>
      )}
      className="border-slate-400"
    />
  );
}

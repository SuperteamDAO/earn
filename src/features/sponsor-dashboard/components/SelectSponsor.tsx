import axios from 'axios';
import { atom, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { components } from 'react-select';
import AsyncSelect from 'react-select/async';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import type { SponsorType } from '@/interface/sponsor';
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

  const [selectedSponsor, setSelectedSponsor] = useState<SponsorOption | null>(
    null,
  );
  const setHackathonSponsor = useSetAtom(hackathonSponsorAtom);

  useEffect(() => {
    if (type !== 'hackathon' && user?.currentSponsor?.id) {
      setSelectedSponsor({
        value: user?.currentSponsor?.id,
        label: user?.currentSponsor?.name,
        sponsor: user?.currentSponsor,
      });
    }
  }, [user]);

  const loadSponsors = (
    inputValue: string,
    callback: (options: SponsorOption[]) => void,
  ) => {
    axios
      .get(`/api/sponsors/list/`, {
        params: {
          searchString: inputValue,
        },
      })
      .then((response) => {
        const options = [...(response?.data || [])];
        callback(options);
      });
  };

  const updateSponsor = async (sponsorId: string) => {
    try {
      await updateUser.mutateAsync({ currentSponsorId: sponsorId });
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = async (option?: any) => {
    if (type === 'hackathon') {
      setHackathonSponsor(option.value);
      setSelectedSponsor(option);
    } else {
      await updateSponsor(option.value);
    }
  };

  // eslint-disable-next-line unused-imports/no-unused-vars
  const SingleValue = ({ children, ...props }: any) => {
    const { data, selectProps } = props;

    if (selectProps.menuIsOpen) {
      return <components.SingleValue {...props}></components.SingleValue>;
    }

    return (
      <components.SingleValue {...props}>
        <div className="flex items-center py-1">
          <EarnAvatar
            id={data?.sponsor?.name}
            avatar={data?.sponsor?.logo}
            borderRadius="rounded-sm"
            size={'24px'}
          />
          <div className="ml-2 hidden md:block">
            <div className="flex">
              <p className="text-sm text-slate-800">{data?.sponsor?.name}</p>
            </div>
            <p className="text-xs text-slate-400">{data?.sponsor?.role}</p>
          </div>
        </div>
      </components.SingleValue>
    );
  };

  const Option = (props: any) => {
    const { data } = props;
    return (
      <components.Option {...props}>
        <div className="flex items-center">
          <EarnAvatar
            id={data?.sponsor?.name}
            avatar={data?.sponsor?.logo}
            borderRadius="rounded-sm"
          />
          <div className="ml-2 hidden md:block">
            <div className="flex flex-wrap items-center">
              <p className="text-sm text-slate-800">{data?.sponsor?.name}</p>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-xs text-slate-400">{data?.sponsor?.role}</p>
              {data?.sponsor?.isVerified && <VerifiedBadge />}
            </div>
          </div>
        </div>
      </components.Option>
    );
  };

  return (
    <AsyncSelect
      components={{ SingleValue, Option }}
      value={selectedSponsor}
      onChange={(e) => handleChange(e)}
      placeholder="Select Sponsor"
      loadOptions={loadSponsors}
      defaultOptions
      isClearable={false}
      isSearchable={true}
      autoFocus={false}
      styles={{
        control: (baseStyles) => ({
          ...baseStyles,
          cursor: 'pointer',
          fontSize: '14px',
          borderColor: '#cbd5e1',
          '&:hover': {
            borderColor: '#6366F1',
          },
          minHeight: '46px',
          flexWrap: 'nowrap',
        }),
        dropdownIndicator: (base) => ({
          ...base,
          color: '#cbd5e1',
          '&:hover': {
            color: '#94a3b8',
          },
          display: isExpanded ? 'block' : 'none',
        }),
        indicatorSeparator: (base) => ({
          ...base,
          backgroundColor: 'transparent',
          width: 0,
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected ? '#e2e8f0' : 'white',
          '&:hover': {
            backgroundColor: '#f1f5f9',
          },
        }),
      }}
    />
  );
}

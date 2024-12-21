import axios from 'axios';
import { useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { components } from 'react-select';
import AsyncSelect from 'react-select/async';

import type { SponsorType } from '@/interface/sponsor';
import { useUpdateUser, useUser } from '@/store/user';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { hackathonSponsorAtom } from './SelectSponsor';

interface HackathonOptionType extends SponsorType {
  role?: string;
}

interface HackathonOption {
  value?: string;
  label?: string;
  hackathon?: HackathonOptionType;
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

  useEffect(() => {
    if (type !== 'hackathon' && user?.hackathonId) {
      setSelectedHackathon({
        value: user?.Hackathon?.id,
        label: user?.Hackathon?.name,
        hackathon: user?.Hackathon,
      });
    }
  }, [user]);

  const loadHackathons = (
    inputValue: string,
    callback: (options: HackathonOption[]) => void,
  ) => {
    axios
      .get(`/api/hackathon/list/`, {
        params: {
          searchString: inputValue,
        },
      })
      .then((response) => {
        const options = [...(response?.data || [])];
        callback(options);
      });
  };

  const updateSponsor = async (hackathonId: string) => {
    try {
      await updateUser.mutateAsync({ hackathonId });
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = async (option?: any) => {
    if (type === 'hackathon') {
      setHackathonSponsor(option.value);
      setSelectedHackathon(option);
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
            id={data?.hackathon?.name}
            avatar={data?.hackathon?.logo}
            className="h-6 w-6 rounded-sm"
          />
          <div className="ml-2 hidden md:block">
            <p className="text-sm text-slate-800">{data?.hackathon?.name}</p>
            <p className="text-xs text-slate-400">{data?.hackathon?.role}</p>
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
            className="rounded-sm"
            id={data?.hackathon?.name}
            avatar={data?.hackathon?.logo}
          />
          <div className="ml-2 hidden md:block">
            <p className="text-sm text-slate-800">{data?.hackathon?.name}</p>
            <p className="text-xs text-slate-400">{data?.hackathon?.role}</p>
          </div>
        </div>
      </components.Option>
    );
  };

  return (
    <AsyncSelect
      components={{ SingleValue, Option }}
      value={selectedHackathon}
      onChange={(e) => handleChange(e)}
      placeholder="Select Hackathon"
      loadOptions={loadHackathons}
      defaultOptions
      isClearable={false}
      isSearchable={true}
      autoFocus={false}
      styles={{
        control: (baseStyles) => ({
          ...baseStyles,
          cursor: 'pointer',
          fontSize: '14px',
          borderColor: '#94a3b8',
          '&:hover': {
            borderColor: '#6366F1',
          },
          minHeight: '46px',
          flexWrap: 'nowrap',
        }),
        dropdownIndicator: (base) => ({
          ...base,
          color: '#94a3b8',
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

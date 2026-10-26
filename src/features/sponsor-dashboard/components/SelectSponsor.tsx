'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  components,
  type OptionProps,
  type SingleValueProps,
} from 'react-select';
import AsyncSelect from 'react-select/async';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { getJson, postJson } from '@/lib/fetch-json';
import { useViewer } from '@/lib/viewer';
import type { SponsorOption } from '@/server/sponsor-switch';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

type CurrentSponsor = Pick<SponsorOption['sponsor'], 'name' | 'logo'> & {
  readonly role?: string;
  readonly isVerified?: boolean;
};

interface Option {
  readonly value: string;
  readonly label: string;
  readonly sponsor: CurrentSponsor;
}

function SingleValue(props: SingleValueProps<Option, false>) {
  const { data, selectProps } = props;

  if (selectProps.menuIsOpen) {
    return <components.SingleValue {...props}></components.SingleValue>;
  }

  return (
    <components.SingleValue {...props}>
      <div className="flex items-center py-1">
        <EarnAvatar
          id={data?.sponsor?.name}
          avatar={data?.sponsor?.logo ?? undefined}
          className="h-6 w-6 rounded-sm"
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
}

function SponsorOptionRow(props: OptionProps<Option, false>) {
  const { data } = props;
  return (
    <components.Option {...props}>
      <div className="flex items-center">
        <EarnAvatar
          id={data?.sponsor?.name}
          avatar={data?.sponsor?.logo ?? undefined}
          className="rounded-sm"
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
}

const loadSponsors = (
  inputValue: string,
  callback: (options: Option[]) => void,
) => {
  getJson<Option[]>(
    `/earn/dashboard/sponsor-switch/?searchString=${encodeURIComponent(inputValue)}`,
  )
    .then((options) => callback([...(options || [])]))
    .catch(() => callback([]));
};

// Switches the sponsor they act for: their own, or any in God mode.
export function SelectSponsor({
  isExpanded = false,
}: {
  isExpanded?: boolean;
}) {
  const user = useViewer();
  const pathname = usePathname() ?? '';

  // Picked, while the page reloads for the new sponsor.
  const [picked, setPicked] = useState<Option | null>(null);
  const [isSwitchingSponsor, setIsSwitchingSponsor] = useState(false);
  const current = user?.currentSponsor;
  const selectedSponsor: Option | null =
    picked ??
    (current
      ? {
          value: current.id,
          label: current.name,
          sponsor: current,
        }
      : null);

  const updateSponsor = async (sponsorId: string) => {
    try {
      setIsSwitchingSponsor(true);
      await postJson('/earn/dashboard/sponsor-switch/', { sponsorId });
      return true;
    } catch (error) {
      console.error(error);
      setIsSwitchingSponsor(false);
      return false;
    }
  };

  const handleChange = async (option: Option | null) => {
    if (!option || isSwitchingSponsor) return;

    setPicked(option);
    const didSwitch = await updateSponsor(option.value);
    if (!didSwitch) return;

    if (pathname.startsWith('/earn/dashboard/')) {
      window.location.assign('/earn/dashboard/listings/');
      return;
    }

    window.location.reload();
  };

  return (
    <AsyncSelect
      components={{ SingleValue, Option: SponsorOptionRow }}
      value={selectedSponsor}
      onChange={(option) => void handleChange(option)}
      placeholder="Select Sponsor"
      loadOptions={loadSponsors}
      defaultOptions
      isDisabled={isSwitchingSponsor}
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
        menuList: (base) => ({
          ...base,
          overflowX: 'hidden',

          '::-webkit-scrollbar': {
            width: 'calc(var(--spacing) * 1.5)',
          },
          '::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '::-webkit-scrollbar-thumb': {
            background: 'var(--color-slate-300)',
            borderRadius: '0.35rem',
          },
          '::-webkit-scrollbar-thumb:hover': {
            background: 'var(--color-slate-300)',
          },
        }),
      }}
    />
  );
}

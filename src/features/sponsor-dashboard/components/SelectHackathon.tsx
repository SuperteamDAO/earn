'use client';

import { useRouter } from 'next/navigation';
import {
  components,
  type OptionProps,
  type SingleValueProps,
} from 'react-select';
import AsyncSelect from 'react-select/async';

import { getJson, postJson } from '@/lib/fetch-json';
import { useViewer } from '@/lib/viewer';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

interface Option {
  readonly value?: string;
  readonly label?: string;
  readonly hackathon?: {
    readonly name?: string;
    readonly altLogo?: string | null;
    readonly role?: string;
  };
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
          id={data?.hackathon?.name}
          avatar={data?.hackathon?.altLogo ?? undefined}
          className="h-6 w-6 rounded-sm"
        />
        <div className="ml-2 hidden md:block">
          <p className="text-sm text-slate-800">{data?.hackathon?.name}</p>
          <p className="text-xs text-slate-400">{data?.hackathon?.role}</p>
        </div>
      </div>
    </components.SingleValue>
  );
}

function HackathonOptionRow(props: OptionProps<Option, false>) {
  const { data } = props;
  return (
    <components.Option {...props}>
      <div className="flex items-center">
        <EarnAvatar
          className="rounded-sm"
          id={data?.hackathon?.name}
          avatar={data?.hackathon?.altLogo ?? undefined}
        />
        <div className="ml-2 hidden md:block">
          <p className="text-sm text-slate-800">{data?.hackathon?.name}</p>
          <p className="text-xs text-slate-400">{data?.hackathon?.role}</p>
        </div>
      </div>
    </components.Option>
  );
}

const loadHackathons = (
  inputValue: string,
  callback: (options: Option[]) => void,
) => {
  getJson<Option[]>(
    `/earn/dashboard/hackathon-switch/?searchString=${encodeURIComponent(inputValue)}`,
  )
    .then((options) => callback([...(options || [])]))
    .catch(() => callback([]));
};

// Switches the hackathon the dashboard shows (God mode).
export function SelectHackathon({
  isExpanded = false,
}: {
  isExpanded?: boolean;
}) {
  const user = useViewer();
  const router = useRouter();

  const selectedHackathon: Option | null = user?.hackathonId
    ? {
        value: user?.Hackathon?.id,
        label: user?.Hackathon?.name,
        hackathon: user?.Hackathon ?? undefined,
      }
    : null;

  const handleChange = async (option: Option | null) => {
    if (!option?.value) return;
    try {
      await postJson('/earn/dashboard/hackathon-switch/', {
        hackathonId: option.value,
      });
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AsyncSelect
      components={{ SingleValue, Option: HackathonOptionRow }}
      value={selectedHackathon}
      onChange={(option) => void handleChange(option)}
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

import { Calendar } from 'lucide-react';

import FaRegClock from '@/components/icons/FaRegClock';
import TbBriefcase2 from '@/components/icons/TbBriefcase2';

import { type HackathonSortOption } from '../../hackathon/hooks/useHackathons';
import {
  type ListingSortOption,
  type ListingStatus,
  type OrderDirection,
} from '../hooks/useListings';

interface SortOption {
  readonly label: string;
  readonly params: {
    readonly sortBy: ListingSortOption;
    readonly order: OrderDirection;
  };
  readonly icon: React.ReactNode;
}

interface HackathonSortOptions {
  readonly label: string;
  readonly params: {
    readonly sortBy: HackathonSortOption;
    readonly order: OrderDirection;
  };
  readonly icon: React.ReactNode;
}

export const getListingSortOptions = (
  status: ListingStatus,
  showStatusSort?: boolean,
): readonly SortOption[] => {
  let dateAscLabel: string;
  let dateDescLabel: string;

  switch (status) {
    case 'all':
    case 'open':
      dateAscLabel = 'Deadline: Soonest First';
      dateDescLabel = 'Deadline: Furthest First';
      break;
    case 'review':
      dateAscLabel = 'Expired: Newest First';
      dateDescLabel = 'Expired: Oldest First';
      break;
    case 'completed':
      dateAscLabel = 'Completed: Newest First';
      dateDescLabel = 'Completed: Oldest First';
      break;
    default:
      dateAscLabel = 'Deadline: Soonest First';
      dateDescLabel = 'Deadline: Furthest First';
      break;
  }

  const baseOptions: SortOption[] = [
    {
      label: dateAscLabel,
      params: { sortBy: 'Date', order: 'asc' },
      icon: <FaRegClock className="size-4" />,
    },
    {
      label: dateDescLabel,
      params: { sortBy: 'Date', order: 'desc' },
      icon: <FaRegClock className="size-4" />,
    },
  ];

  if (showStatusSort) {
    baseOptions.unshift({
      label: 'Status',
      params: { sortBy: 'Status', order: 'asc' },
      icon: <Calendar className="size-[1.0625rem]" />,
    });
  }

  return [
    ...baseOptions,
    {
      label: 'Prize: High to Low',
      params: { sortBy: 'Prize', order: 'desc' },
      icon: (
        <img
          alt={'USDC'}
          src={'https://s2.coinmarketcap.com/static/img/coins/128x128/3408.png'}
          className="size-4"
        />
      ),
    },
    {
      label: 'Prize: Low to High',
      params: { sortBy: 'Prize', order: 'asc' },
      icon: (
        <img
          alt={'USDC'}
          src={'https://s2.coinmarketcap.com/static/img/coins/128x128/3408.png'}
          className="size-4"
        />
      ),
    },
    {
      label: 'Submissions: High to Low',
      params: { sortBy: 'Submissions', order: 'desc' },
      icon: <TbBriefcase2 className="size-4.5" />,
    },
    {
      label: 'Submissions: Low to High',
      params: { sortBy: 'Submissions', order: 'asc' },
      icon: <TbBriefcase2 className="size-4.5" />,
    },
  ];
};

export const HACKATHON_SORT_OPTIONS: readonly HackathonSortOptions[] = [
  {
    label: 'Prize: High to Low',
    params: { sortBy: 'Prize', order: 'desc' },
    icon: (
      <img
        alt={'USDC'}
        src={'https://s2.coinmarketcap.com/static/img/coins/128x128/3408.png'}
        className="size-4"
      />
    ),
  },
  {
    label: 'Prize: Low to High',
    params: { sortBy: 'Prize', order: 'asc' },
    icon: (
      <img
        alt={'USDC'}
        src={'https://s2.coinmarketcap.com/static/img/coins/128x128/3408.png'}
        className="size-4"
      />
    ),
  },
  {
    label: 'Submissions: High to Low',
    params: { sortBy: 'Submissions', order: 'desc' },
    icon: <TbBriefcase2 className="size-4.5" />,
  },
  {
    label: 'Submissions: Low to High',
    params: { sortBy: 'Submissions', order: 'asc' },
    icon: <TbBriefcase2 className="size-4.5" />,
  },
];

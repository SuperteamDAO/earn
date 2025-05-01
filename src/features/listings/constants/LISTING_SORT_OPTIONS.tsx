import { FaRegClock } from 'react-icons/fa6';
import { TbBriefcase2 } from 'react-icons/tb';

import {
  type ListingSortOption,
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

export const LISTING_SORT_OPTIONS: readonly SortOption[] = [
  {
    label: 'Due Date: Earliest to Latest',
    params: { sortBy: 'Due Date', order: 'asc' },
    icon: <FaRegClock className="size-4" />,
  },
  {
    label: 'Due Date: Latest to Earliest',
    params: { sortBy: 'Due Date', order: 'desc' },
    icon: <FaRegClock className="size-4" />,
  },
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

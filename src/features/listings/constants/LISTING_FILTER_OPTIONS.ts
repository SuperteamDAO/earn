import { type ListingStatus } from '../hooks/useListings';

interface FilterOption {
  readonly label: string;
  readonly params: { readonly status: ListingStatus };
  readonly circleClasses: {
    readonly border: string;
    readonly bg: string;
  };
}

export const ALL_FILTER_OPTION: FilterOption = {
  label: 'All',
  params: { status: 'all' },
  circleClasses: {
    border: 'border-slate-300',
    bg: 'bg-slate-400',
  },
};

export const LISTING_FILTER_OPTIONS: readonly FilterOption[] = [
  {
    label: 'Open',
    params: { status: 'open' },
    circleClasses: {
      border: 'border-emerald-600/40',
      bg: 'bg-green-500',
    },
  },
  {
    label: 'In Review',
    params: { status: 'review' },
    circleClasses: {
      border: 'border-orange-200',
      bg: 'bg-orange-400',
    },
  },
  {
    label: 'Completed',
    params: { status: 'completed' },
    circleClasses: {
      border: 'border-slate-300',
      bg: 'bg-slate-600',
    },
  },
];

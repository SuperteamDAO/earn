import * as React from 'react';
import ReactSelect, { type Props as ReactSelectProps } from 'react-select';

import { cn } from '@/utils';

export interface SelectProps extends Omit<ReactSelectProps, 'classNames'> {
  className?: string;
}

const MultiSelect = React.forwardRef<any, SelectProps>(
  ({ className, ...props }, ref) => {
    return (
      <ReactSelect
        ref={ref}
        {...props}
        classNames={{
          control: ({ isFocused }) =>
            cn(
              'h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors',
              'text-slate-700 placeholder:text-slate-400',
              'focus-visible:outline-none focus:ring-1 focus:ring-brand-purple',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'md:text-sm',
              isFocused && 'ring-1 ring-brand-purple',
              className,
            ),
          placeholder: () => 'text-slate-400',
          input: () => 'text-slate-700 md:text-sm',
          option: ({ isFocused, isSelected }) =>
            cn(
              'p-2 text-slate-700 md:text-sm',
              isFocused && 'bg-slate-100',
              isSelected && 'bg-brand-purple text-white',
            ),
          menu: () => 'mt-1 border border-input rounded-md bg-white shadow-sm',
          multiValue: () => 'bg-brand-purple/10 rounded-md mr-1',
          multiValueLabel: () => 'text-brand-purple px-1 py-0.5 text-sm',
          multiValueRemove: () =>
            'hover:bg-brand-purple/20 text-brand-purple rounded-r-md px-1 py-0.5',
          clearIndicator: () => 'text-slate-400 hover:text-slate-500',
          dropdownIndicator: () => 'text-slate-400 hover:text-slate-500',
        }}
        unstyled
      />
    );
  },
);

MultiSelect.displayName = 'MultiSelect';

export { MultiSelect };

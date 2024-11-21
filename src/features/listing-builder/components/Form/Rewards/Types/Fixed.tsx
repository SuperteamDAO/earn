import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { useListingForm } from '../../../../hooks';
import { TokenNumberInput } from '../Tokens';

export function Fixed() {
  const form = useListingForm();

  const rewards = useWatch({
    control: form.control,
    name: 'rewards',
  });
  const type = useWatch({
    control: form.control,
    name: 'type',
  });
  useEffect(() => {
    console.log('rewards', rewards);
  }, [rewards]);
  useEffect(() => {
    if (type === 'project') form.setValue('rewardAmount', rewards?.[1]);
  }, [type]);
  return (
    <FormField
      control={form.control}
      name={'rewardAmount'}
      render={({ field }) => (
        <FormItem className="gap-2">
          <FormLabel isRequired>Fixed Prize</FormLabel>
          <FormControl>
            <TokenNumberInput
              {...field}
              placeholder="10,000"
              className="pr-6"
              onChange={(e) => {
                field.onChange(e);
                form.setValue(`rewards`, { 1: e || NaN });
                form.saveDraft();
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

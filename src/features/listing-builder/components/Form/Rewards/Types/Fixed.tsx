import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { MAX_REWARD } from '@/features/listing-builder/constants';

import { useListingForm } from '../../../../hooks';
import { TokenNumberInput } from '../Tokens/TokenNumberInput';

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
    if (type === 'project') form.setValue('rewardAmount', rewards?.[1]);
    // react-doctor-disable-next-line react-doctor/exhaustive-deps -- copies the prize once when the type becomes project; later edits set rewardAmount in onChange, and re-syncing would turn a cleared 0 into undefined
  }, [type, form.setValue]);
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
              max={MAX_REWARD}
              onChange={(e) => {
                field.onChange(e);
                if (e) form.setValue(`rewards`, { 1: e });
                else form.setValue(`rewards`, {});
                form.saveDraft();
              }}
            />
          </FormControl>
          <FormMessage>
            {form.formState.errors.rewards?.[1]?.message}
          </FormMessage>
        </FormItem>
      )}
    />
  );
}

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

export function Range() {
  const form = useListingForm();
  return (
    <div className="flex">
      <FormField
        control={form.control}
        name="minRewardAsk"
        render={({ field }) => (
          <FormItem className="gap-2">
            <FormLabel isRequired>From</FormLabel>
            <FormControl>
              <TokenNumberInput
                {...field}
                max={MAX_REWARD}
                placeholder="5,000"
                className="relative rounded-r-none focus-within:z-10"
                onChange={(e) => {
                  field.onChange(e);
                  form.saveDraft();
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="maxRewardAsk"
        render={({ field }) => (
          <FormItem className="gap-2">
            <FormLabel isRequired>To</FormLabel>
            <FormControl>
              <TokenNumberInput
                {...field}
                placeholder="10,000"
                className="relative rounded-l-none pr-6 focus-within:z-10"
                max={MAX_REWARD}
                onChange={(e) => {
                  field.onChange(e);
                  form.saveDraft();
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

import React from 'react';

import { SuperteamCombobox } from '@/components/shared/SuperteamCombobox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';

import { useListingForm } from '../../../hooks';

export function ReferredBy() {
  const form = useListingForm();
  return (
    <FormField
      name="referredBy"
      control={form?.control}
      render={({ field }) => {
        return (
          <FormItem className="flex flex-row items-center justify-between gap-4">
            <div className="grow">
              <FormLabel className="">
                Did a Superteam refer you to Earn?
              </FormLabel>
              <FormDescription className="flex gap-1">
                Select a Superteam only if applicable.
              </FormDescription>
            </div>
            <FormControl className="flex items-center">
              <SuperteamCombobox
                unset
                value={field.value}
                onChange={(e) => {
                  field.onChange(e);
                  form.saveDraft();
                }}
              />
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
}

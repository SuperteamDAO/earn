import { Regions } from '@prisma/client';
import React from 'react';

import { RegionCombobox } from '@/components/shared/RegionCombobox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';

import { useListingForm } from '../../../hooks';

export function GeoLock() {
  const form = useListingForm();
  return (
    <FormField
      name="region"
      control={form?.control}
      render={({ field }) => {
        return (
          <FormItem className="flex flex-row items-center justify-between gap-4">
            <div className="flex-grow">
              <FormLabel className="">Geo-locking</FormLabel>
              <FormDescription className="flex gap-1">
                {field.value === Regions.GLOBAL ? (
                  'Anyone in the world can participate'
                ) : (
                  <>
                    Participation restricted to{' '}
                    {field.value?.charAt(0).toUpperCase() +
                      field.value?.slice(1).toLowerCase()}
                  </>
                )}
              </FormDescription>
            </div>
            <FormControl className="flex items-center">
              <RegionCombobox
                superteams
                global
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

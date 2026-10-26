'use client';

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { RegionCombobox } from '@/components/shared/RegionCombobox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { countries, SANCTIONED_COUNTRY_CODES } from '@/constants/country';
import { getJson } from '@/lib/fetch-json';

import {
  type NewTalentFormData,
  newTalentSchema,
} from '@/features/talent/schema';

// `countryCode` is where the request came from, when the server knows.
export function LocationField({ countryCode }: { countryCode: string | null }) {
  const form = useFormContext<NewTalentFormData>();
  const { control, watch, setValue } = form;

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const currentLocation = watch('location');
        if (!currentLocation) {
          const locationData = countryCode
            ? { country_code: countryCode }
            : await getJson<{ country_code?: string }>('/api/location/');

          const code = locationData?.country_code;
          if (code) {
            const country = countries.find(
              (ct) => ct.code.toLowerCase() === code.toLowerCase(),
            );

            if (country && !SANCTIONED_COUNTRY_CODES.includes(country.code)) {
              setValue(
                'location',
                newTalentSchema.shape.location.safeParse(country.name).data ||
                  '',
              );
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch location:', error);
      }
    };

    void fetchLocation();
  }, [setValue, watch, countryCode]);

  return (
    <FormField
      name="location"
      control={control}
      render={({ field }) => (
        <FormItem className="mb-3 w-full gap-1 sm:mb-4 sm:gap-2">
          <FormLabel isRequired className="">
            Location
          </FormLabel>
          <FormControl>
            <RegionCombobox
              className="h-9 w-full"
              excludeSanctioned
              value={field.value}
              onChange={(e) => {
                field.onChange(e);
              }}
              classNames={{
                popoverContent: 'w-[var(--radix-popper-anchor-width)]',
              }}
            />
          </FormControl>
          <FormMessage className="mt-1" />
        </FormItem>
      )}
    />
  );
}

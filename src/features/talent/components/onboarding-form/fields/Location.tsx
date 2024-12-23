import axios from 'axios';
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
import { countries } from '@/constants/country';

import {
  type NewTalentFormData,
  newTalentSchema,
} from '@/features/talent/schema';

export function LocationField() {
  const form = useFormContext<NewTalentFormData>();
  const { control, watch, setValue } = form;

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const currentLocation = watch('location');
        if (!currentLocation) {
          const response = await axios.get('https://ipapi.co/json/');
          const locationData = response.data;

          if (locationData && locationData.country_code) {
            const country = countries.find(
              (ct) =>
                ct.code.toLowerCase() ===
                locationData.country_code.toLowerCase(),
            );

            if (country) {
              setValue(
                'location',
                newTalentSchema.shape.location.safeParse(country.name).data ||
                  undefined,
              );
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch location:', error);
      }
    };

    fetchLocation();
  }, [setValue, watch]);

  return (
    <FormField
      name="location"
      control={control}
      render={({ field }) => (
        <FormItem className="mb-4 w-full gap-2">
          <FormLabel className="">Location</FormLabel>
          <FormControl>
            <RegionCombobox
              unset
              className="w-full"
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

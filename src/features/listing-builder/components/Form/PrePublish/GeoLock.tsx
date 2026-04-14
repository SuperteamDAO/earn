import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';

import { RegionCombobox } from '@/components/shared/RegionCombobox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tooltip } from '@/components/ui/tooltip';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { isEditingAtom } from '../../../atoms';
import { useListingForm } from '../../../hooks';
import { getOfficialSuperteamRegion } from '../../../utils/getOfficialSuperteamRegion';

export function GeoLock() {
  const form = useListingForm();
  const { user } = useUser();
  const isEditing = useAtomValue(isEditingAtom);
  const region = useWatch({
    control: form.control,
    name: 'region',
  });
  const officialSuperteamRegion = getOfficialSuperteamRegion(
    user?.currentSponsor,
  );
  const fallbackRegion = officialSuperteamRegion || 'Global';
  const isRegionLocked = !!officialSuperteamRegion && !isEditing;
  const lockTooltip =
    'Contact the global team if you want to add a global listing.';
  const normalizedRegion = region?.trim();

  useEffect(() => {
    if (normalizedRegion && (!isRegionLocked || region === fallbackRegion)) {
      return;
    }

    form.setValue('region', fallbackRegion, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.clearErrors('region');

    if (isRegionLocked && officialSuperteamRegion) {
      form.saveDraft();
    }
  }, [
    fallbackRegion,
    form,
    isRegionLocked,
    normalizedRegion,
    officialSuperteamRegion,
    region,
  ]);

  return (
    <FormField
      name="region"
      control={form?.control}
      render={({ field }) => {
        return (
          <FormItem className="gap-2">
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="grow">
                <FormLabel className="">Geo-locking</FormLabel>
                <FormDescription className="flex gap-1">
                  {field.value === 'Global' ? (
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
                <div
                  className={cn(
                    'relative',
                    isRegionLocked && 'cursor-not-allowed',
                  )}
                >
                  <RegionCombobox
                    superteams
                    global
                    disabled={isRegionLocked}
                    value={field.value}
                    className={cn(
                      isRegionLocked && 'bg-slate-100 text-slate-400',
                    )}
                    onChange={(e) => {
                      if (isRegionLocked) return;
                      field.onChange(e);
                      form.clearErrors('region');
                      form.saveDraft();
                    }}
                    regions
                  />
                  {isRegionLocked && (
                    <Tooltip
                      content={lockTooltip}
                      triggerClassName="absolute inset-0 z-10 cursor-not-allowed rounded-md bg-transparent"
                    >
                      <span className="sr-only">{lockTooltip}</span>
                    </Tooltip>
                  )}
                </div>
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

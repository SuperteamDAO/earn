import { useAtomValue } from 'jotai';
import Image from 'next/image';
import { useEffect, useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getListingIcon } from '@/features/listings';

import { hackathonAtom, isEditingAtom } from '../../atoms';
import { useListingForm } from '../../hooks';
import { calculateTotalRewardsForPodium } from '../../utils';

const typeOptions = [
  { value: 'bounty', label: 'Bounty' },
  { value: 'project', label: 'Project' },
] as const;

export function TitleAndType() {
  const form = useListingForm();
  return (
    <FormField
      name="title"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem className="gap-2">
            <FormLabel>Listing Title</FormLabel>
            <div className="flex w-full rounded-md border ring-primary has-[:focus]:ring-1">
              <Type />
              <FormControl>
                <Input
                  placeholder="Develop Something on solana"
                  {...field}
                  className="mt-0 border-none focus-visible:ring-0"
                  defaultValue={''}
                  onChange={(e) => {
                    field.onChange(e);
                    form.saveDraft();
                  }}
                />
              </FormControl>
            </div>
            <div className="flex justify-between">
              <FormMessage />
              <div className="ml-auto text-right text-xs text-slate-400">
                {100 - (form.watch('title')?.length || 0)} characters left
              </div>
            </div>
          </FormItem>
        );
      }}
    />
  );
}

function Type() {
  const form = useListingForm();
  const isEditing = useAtomValue(isEditingAtom);
  const hackathon = useAtomValue(hackathonAtom);
  useEffect(() => {
    console.log('isEditing type', isEditing);
  }, [isEditing]);
  const hackathonId = useWatch({
    control: form.control,
    name: 'hackathonId',
  });
  useMemo(() => {
    console.log('hackathonId', hackathonId);
  }, [hackathonId]);
  return (
    <FormField
      name="type"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem className="w-fit">
            <FormControl>
              <Select
                value={field.value}
                disabled={isEditing}
                onValueChange={(e) => {
                  field.onChange(e);
                  if (e === 'hackathon') {
                    if (hackathon) {
                      console.log('set hackathon value - ', hackathon);
                      form.setValue('hackathonId', hackathon.id);
                    }
                  } else {
                    form.setValue('hackathonId', undefined);
                  }
                  // form.setValue('rewards', undefined)
                  // form.setValue('rewardAmount', undefined)
                  // if(e !== 'project') {
                  //   form.setValue('compensationType','fixed')
                  // }
                  //
                  const values = form.getValues();
                  if (e !== 'project') {
                    form.setValue(
                      'rewardAmount',
                      calculateTotalRewardsForPodium(
                        values.rewards || {},
                        values.maxBonusSpots,
                      ),
                    );
                  } else {
                    if (values.compensationType === 'fixed') {
                      form.setValue('rewardAmount', values.rewards?.[1]);
                    } else {
                      form.setValue('rewardAmount', undefined);
                    }
                  }
                }}
              >
                <SelectTrigger className="h-full w-32 rounded-none border-0 border-r focus:ring-0">
                  <div className="flex items-center gap-2">
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2 text-xs">
                        <Image
                          src={getListingIcon(value)}
                          alt={value}
                          className="h-4 w-4"
                          width={16}
                          height={16}
                        />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {hackathon && (
                    <SelectItem key={'hackathon'} value={'hackathon'}>
                      <div className="flex items-center gap-2 text-xs">
                        <Image
                          src={hackathon.logo}
                          alt={hackathon.name}
                          className="h-4 w-4 object-contain"
                          width={16}
                          height={16}
                        />
                        <span>{hackathon.name}</span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
}

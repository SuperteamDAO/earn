import { useAtomValue } from 'jotai';
import Image from 'next/image';

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

import { isEditingAtom } from '../../atoms';
import { useListingForm } from '../../hooks';
import { calculateTotalRewardsForPodium } from '../../utils';

const typeOptions = [
  { value: 'bounty', label: 'Bounty' },
  { value: 'project', label: 'Project' },
  { value: 'hackathon', label: 'Hackathon' },
] as const;

export function TitleAndType() {
  const form = useListingForm();
  return (
    <FormField
      name="title"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel>Listing Title</FormLabel>
            <div className="flex rounded-md border ring-primary has-[:focus]:ring-1">
              <Type />
              <FormControl>
                <Input
                  placeholder="Develop Something on solana"
                  {...field}
                  className="border-none focus-visible:ring-0"
                  defaultValue={''}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

function Type() {
  const form = useListingForm();
  const isEditing = useAtomValue(isEditingAtom);
  return (
    <FormField
      name="type"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem>
            <FormControl>
              <Select
                defaultValue={field.value}
                disabled={isEditing}
                onValueChange={(e) => {
                  field.onChange(e);
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
                  form.setFocus('title');
                }}
              >
                <SelectTrigger className="w-32 rounded-none border-0 border-r focus:ring-0">
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
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
}

'use client';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useUser } from '@/store/user';

import { hackathonsAtom, isEditingAtom } from '../../atoms';
import { useListingForm } from '../../hooks';

const deadlineOptions = [
  { label: '1 Week', value: 7 },
  { label: '2 Weeks', value: 14 },
  { label: '3 Weeks', value: 21 },
];

export const DEADLINE_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]';

export function Deadline() {
  const form = useListingForm();
  const { user } = useUser();
  const isGodMode = user?.role === 'GOD';

  const deadline = useWatch({
    name: 'deadline',
    control: form.control,
  });
  const type = useWatch({
    name: 'type',
    control: form.control,
  });
  const hackathonId = useWatch({
    name: 'hackathonId',
    control: form.control,
  });
  const hackathons = useAtomValue(hackathonsAtom);

  const [maxDeadline, setMaxDeadline] = useState<Date | undefined>(undefined);
  const [minDeadline] = useState<Date | undefined>(
    dayjs().add(1, 'day').startOf('day').toDate(),
  );

  const isEditing = useAtomValue(isEditingAtom);

  useEffect(() => {
    if (isEditing) {
      if (deadline) {
        const originalDeadline = dayjs(deadline);
        const twoWeeksLater = originalDeadline.add(2, 'weeks');
        setMaxDeadline(twoWeeksLater.endOf('day').toDate());
        if (isGodMode) {
          setMaxDeadline(undefined);
          return;
        }
      }
    }
    if (!isEditing) {
      const threeMonthsLater = dayjs().add(3, 'months');
      setMaxDeadline(threeMonthsLater.endOf('day').toDate());
    }
    return () => {
      setMaxDeadline(undefined);
    };
  }, [isEditing, isGodMode]);

  const handleDeadlineSelection = (days: number) => {
    return dayjs().add(days, 'day').format(DEADLINE_FORMAT).replace('Z', '');
  };

  // TODO: Debug why zod default for deadline specifically is not working
  useEffect(() => {
    if (form) {
      if (type !== 'hackathon') {
        if (typeof deadline !== 'string') {
          form.setValue('deadline', handleDeadlineSelection(7));
        }
      } else {
        if (hackathons) {
          const currentHackathon = hackathons?.find(
            (s) => s.id === hackathonId,
          );
          if (currentHackathon) {
            form.setValue(
              'deadline',
              currentHackathon.deadline as any as string,
            );
          }
        }
      }
    }
  }, [form, deadline, type, hackathons]);

  return (
    <FormField
      name="deadline"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem className="gap-2">
            <FormLabel isRequired className="">
              Deadline (in {Intl.DateTimeFormat().resolvedOptions().timeZone})
            </FormLabel>
            <div className="ring-primary flex rounded-md border has-focus:ring-1 has-[data-[state=open]]:ring-1">
              <DateTimePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) => {
                  if (date) {
                    const formattedDate = dayjs(date).format(DEADLINE_FORMAT);
                    const localFormat = formattedDate.replace('Z', '');
                    field.onChange(localFormat);
                  } else {
                    field.onChange(undefined);
                  }
                  form.saveDraft();
                }}
                use12HourFormat
                hideSeconds
                max={maxDeadline ? maxDeadline : undefined}
                min={minDeadline ? minDeadline : undefined}
                classNames={{
                  trigger: 'border-0',
                }}
                disabled={type === 'hackathon'}
                minDateTooltipContent="Deadline cannot be in the past"
                maxDateTooltipContent={
                  isEditing
                    ? 'Cannot extend deadline more than 2 weeks from original deadline'
                    : 'Deadline cannot be more than 3 months from today'
                }
              />
            </div>
            {type !== 'hackathon' && (
              <div className="flex flex-wrap gap-2">
                {deadlineOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="sm"
                    className="h-fit w-fit px-2 py-1"
                    onClick={() => {
                      form.setValue(
                        'deadline',
                        handleDeadlineSelection(option.value),
                      );
                      form.saveDraft();
                    }}
                  >
                    <span>{option.label}</span>
                  </Button>
                ))}
              </div>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

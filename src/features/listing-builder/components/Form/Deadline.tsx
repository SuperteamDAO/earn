'use client';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tooltip } from '@/components/ui/tooltip';
import { useUser } from '@/store/user';

import { hackathonsAtom, isEditingAtom } from '../../atoms';
import { DEADLINE_FORMAT } from '../../constants';
import { useListingForm } from '../../hooks';

const deadlineOptions = [
  { label: '1 Week', value: 7 },
  { label: '2 Weeks', value: 14 },
  { label: '3 Weeks', value: 21 },
];

export function Deadline() {
  const form = useListingForm();
  const { user } = useUser();
  const isGodMode = user?.role === 'GOD';

  const deadline = useWatch({
    name: 'deadline',
    control: form.control,
  });
  const hackathonId = useWatch({
    name: 'hackathonId',
    control: form.control,
  });
  const hackathons = useAtomValue(hackathonsAtom);
  const currentHackathon = useMemo(
    () => hackathons?.find((hackathon) => hackathon.id === hackathonId),
    [hackathonId, hackathons],
  );
  const isEditing = useAtomValue(isEditingAtom);
  const originalDeadline = form.formState.defaultValues?.deadline;
  const minDeadline = useMemo(
    () => dayjs().add(1, 'day').startOf('day').toDate(),
    [],
  );
  const maxDeadline = useMemo(() => {
    if (isGodMode) return undefined;

    if (isEditing) {
      if (!originalDeadline) return undefined;
      return dayjs(originalDeadline).add(2, 'weeks').endOf('day').toDate();
    }

    return dayjs().add(3, 'months').endOf('day').toDate();
  }, [isEditing, isGodMode, originalDeadline]);
  const isHackathonDeadlineLocked = Boolean(currentHackathon && hackathonId);
  const hackathonDeadlineValue = currentHackathon?.deadline
    ? new Date(currentHackathon.deadline).toISOString()
    : undefined;
  const hackathonDeadlineTooltip = currentHackathon?.deadline
    ? `The deadline for all ${currentHackathon.name} tracks is ${dayjs(
        currentHackathon.deadline,
      ).format('MMMM DD, YYYY')} and cannot be changed.`
    : undefined;

  const handleDeadlineSelection = (days: number) => {
    return dayjs()
      .add(days, 'day')
      .endOf('day')
      .format(DEADLINE_FORMAT)
      .replace('Z', '');
  };

  // TODO: Debug why zod default for deadline specifically is not working
  useEffect(() => {
    if (!form) return;

    if (hackathonDeadlineValue) {
      if (deadline !== hackathonDeadlineValue) {
        form.setValue('deadline', hackathonDeadlineValue);
      }
      return;
    }

    // Existing listings already have a saved deadline; do not overwrite it on
    // mount while the form is hydrating.
    if (isEditing) return;

    if (typeof deadline !== 'string' || !deadline) {
      form.setValue('deadline', handleDeadlineSelection(7));
    }
  }, [deadline, form, hackathonDeadlineValue, isEditing]);

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
            <Tooltip
              disabled={!hackathonDeadlineTooltip}
              content={
                <p className="max-w-72 text-center">
                  {hackathonDeadlineTooltip}
                </p>
              }
              triggerClassName="block w-full text-left"
            >
              <div className="ring-primary flex rounded-md border has-focus:ring-1 has-[data-[state=open]]:ring-1">
                <DateTimePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date, uiOnly) => {
                    if (date) {
                      const formattedDate = dayjs(date).format(DEADLINE_FORMAT);
                      const localFormat = formattedDate.replace('Z', '');
                      field.onChange(localFormat);
                    } else {
                      field.onChange(undefined);
                    }
                    if (!uiOnly) {
                      form.saveDraft();
                    }
                  }}
                  use12HourFormat
                  hideSeconds
                  max={maxDeadline ? maxDeadline : undefined}
                  min={minDeadline ? minDeadline : undefined}
                  classNames={{
                    trigger: 'border-0',
                  }}
                  disabled={isHackathonDeadlineLocked}
                  minDateTooltipContent="Deadline cannot be in the past"
                  maxDateTooltipContent={
                    isEditing
                      ? 'Cannot extend deadline more than 2 weeks from original deadline'
                      : 'Deadline cannot be more than 3 months from today'
                  }
                />
              </div>
            </Tooltip>
            {!isHackathonDeadlineLocked && (
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

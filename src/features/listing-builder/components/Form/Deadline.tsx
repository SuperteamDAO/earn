import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';

import { DateTimePicker } from '@/components/ui/datetime-picker';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { hackathonAtom, isEditingAtom } from '../../atoms';
import { useListingForm } from '../../hooks';

const deadlineOptions = [
  { label: '1 Week', value: 7 },
  { label: '2 Weeks', value: 14 },
  { label: '3 Weeks', value: 21 },
];

export const DEADLINE_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]';

export function Deadline() {
  const form = useListingForm();
  const deadline = useWatch({
    name: 'deadline',
    control: form.control,
  });
  const type = useWatch({
    name: 'type',
    control: form.control,
  });
  const hackathon = useAtomValue(hackathonAtom);

  const [maxDeadline, setMaxDeadline] = useState<Date | undefined>(undefined);
  const [minDeadline] = useState<Date | undefined>(new Date());

  const [isCustomDate, setIsCustomDate] = useState(false);
  const [customDate, setCustomDate] = useState<string>('0');

  const isEditing = useAtomValue(isEditingAtom);

  useEffect(() => {
    if (isEditing && deadline) {
      const originalDeadline = dayjs(deadline);
      const twoWeeksLater = originalDeadline.add(2, 'weeks');
      setMaxDeadline(twoWeeksLater.toDate());
    }
  }, [isEditing]);

  const handleDeadlineSelection = (days: number) => {
    return dayjs().add(days, 'day').format(DEADLINE_FORMAT);
  };

  const isPresetDeadline = (currentDeadline: string) => {
    const current = dayjs(currentDeadline);
    return deadlineOptions.some(({ value }) => {
      const preset = dayjs().add(value, 'day').format(DEADLINE_FORMAT);
      return dayjs(preset).isSame(current, 'minute');
    });
  };

  // TODO: Debug why zod default for deadline specifically is not working
  useEffect(() => {
    if (form) {
      if (type !== 'hackathon') {
        if (typeof deadline !== 'string') {
          form.setValue('deadline', handleDeadlineSelection(7));
          setCustomDate('7');
          setIsCustomDate(false);
        } else {
          setIsCustomDate(!isPresetDeadline(deadline));
        }
      } else {
        if (hackathon) {
          console.log('hackathon deadline', hackathon.deadline);
          form.setValue('deadline', hackathon.deadline as any as string);
        }
      }
    }
  }, [form, deadline, type, hackathon]);

  return (
    <FormField
      name="deadline"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem className="gap-2">
            <FormLabel className="">
              Deadline (in {Intl.DateTimeFormat().resolvedOptions().timeZone})
            </FormLabel>
            <div className="flex rounded-md border ring-primary has-[:focus]:ring-1 has-[data-[state=open]]:ring-1">
              <DateTimePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) => {
                  if (date) {
                    const formattedDate = dayjs(date).format(DEADLINE_FORMAT);
                    field.onChange(formattedDate);
                    setIsCustomDate(!isPresetDeadline(formattedDate));
                  } else {
                    field.onChange(undefined);
                    setIsCustomDate(false);
                  }
                  console.log('deadline was changed?');
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
              />
              <Select
                onValueChange={(data) => {
                  setCustomDate(data);
                  console.log('deadline option changed?');
                  field.onChange(handleDeadlineSelection(Number(data)));
                }}
                value={customDate}
                disabled={type === 'hackathon'}
              >
                <SelectTrigger className="w-32 rounded-none border-0 border-l text-xs text-slate-500 focus:ring-0">
                  {isCustomDate ? 'Custom' : <SelectValue />}
                </SelectTrigger>
                <SelectContent>
                  {deadlineOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value + ''}>
                      <div className="flex items-center gap-2 pl-2 text-xs text-slate-500">
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

import { InfoIcon } from 'lucide-react';
import { useEffect } from 'react';
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
import { dayjs } from '@/utils/dayjs';

import { DEADLINE_FORMAT } from '../../constants';
import { useListingForm } from '../../hooks';

const quickOptions = [
  { label: '1 Week', value: 7 },
  { label: '2 Weeks', value: 14 },
];

export function WinnerAnnouncementDate() {
  const form = useListingForm();
  const deadline = useWatch({ name: 'deadline', control: form.control });
  const commitmentDate = useWatch({
    name: 'commitmentDate',
    control: form.control,
  });

  const minDate = deadline
    ? dayjs(deadline).add(1, 'day').startOf('day').toDate()
    : undefined;
  const maxDate = deadline
    ? dayjs(deadline).add(30, 'day').startOf('day').toDate()
    : undefined;

  const handleQuickSelect = (days: number, autoSave: boolean = true) => {
    if (!deadline) return;
    const newDate = dayjs(deadline).add(days, 'day').endOf('day').toDate();
    form.setValue(
      'commitmentDate',
      dayjs(newDate).format(DEADLINE_FORMAT).replace('Z', ''),
    );
    form.clearErrors('commitmentDate');
    if (autoSave) form.saveDraft();
  };

  useEffect(() => {
    if (form) {
      if (!commitmentDate) {
        handleQuickSelect(14, false);
      }
    }
  }, [form, commitmentDate, deadline]);

  return (
    <FormField
      name="commitmentDate"
      control={form.control}
      render={({ field }) => (
        <FormItem className="gap-2">
          <div className="flex items-center gap-2">
            <FormLabel isRequired>
              Winner Announcement (
              {Intl.DateTimeFormat().resolvedOptions().timeZone})
            </FormLabel>
            <Tooltip
              content={
                'You can only select a date up to 30 days after the deadline. This is the date you commit to announcing winners.'
              }
            >
              <InfoIcon className="h-3 w-3 text-slate-400" />
            </Tooltip>
          </div>
          <div className="ring-primary flex rounded-md border has-focus:ring-1 has-[data-[state=open]]:ring-1">
            <DateTimePicker
              value={field.value ? new Date(field.value) : undefined}
              onChange={(date, uiOnly) => {
                if (date) {
                  const formattedDate = dayjs(date).format(
                    'YYYY-MM-DDTHH:mm:ss.SSS',
                  );
                  field.onChange(formattedDate);
                } else {
                  field.onChange(undefined);
                }
                if (!uiOnly) {
                  form.saveDraft();
                }
              }}
              use12HourFormat
              hideSeconds
              min={minDate}
              max={maxDate}
              classNames={{ trigger: 'border-0' }}
              minDateTooltipContent="Must be at least 1 day after the deadline"
              maxDateTooltipContent="Cannot be more than 30 days after the deadline"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {quickOptions.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                className="h-fit w-fit px-2 py-1"
                onClick={() => handleQuickSelect(option.value)}
                disabled={!deadline}
              >
                <span>{option.label}</span>
              </Button>
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

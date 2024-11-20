'use client';

import { CalendarIcon } from '@radix-ui/react-icons';
import {
  addHours,
  addMonths,
  endOfDay,
  endOfHour,
  endOfMinute,
  endOfMonth,
  endOfYear,
  format,
  getMonth,
  getYear,
  parse,
  setHours,
  setMilliseconds,
  setMinutes,
  setMonth as setMonthFns,
  setSeconds,
  setYear,
  startOfDay,
  startOfHour,
  startOfMinute,
  startOfMonth,
  startOfYear,
  subHours,
  subMonths,
} from 'date-fns';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  Clock,
  XCircle,
} from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DayPicker, type Matcher, TZDate } from 'react-day-picker';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils';

export type CalendarProps = Omit<
  React.ComponentProps<typeof DayPicker>,
  'mode'
>;

const AM_VALUE = 0;
const PM_VALUE = 1;

export type DateTimePickerProps = {
  /**
   * The datetime value to display and control.
   */
  value: Date | undefined;
  /**
   * Callback function to handle datetime changes.
   */
  onChange: (date: Date | undefined) => void;
  /**
   * The minimum datetime value allowed.
   * @default undefined
   */
  min?: Date;
  /**
   * The maximum datetime value allowed.
   */
  max?: Date;
  /**
   * The timezone to display the datetime in, based on the date-fns.
   * For a complete list of valid time zone identifiers, refer to:
   * https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
   * @default undefined
   */
  timezone?: string;
  /**
   * Whether the datetime picker is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether to show the time picker.
   * @default false
   */
  hideTime?: boolean;
  /**
   * Whether to use 12-hour format.
   * @default false
   */
  hideSeconds?: boolean;
  /**
   * Whether to hide seconds in dropdown.
   * @default false
   */
  use12HourFormat?: boolean;
  /**
   * Whether to show the clear button.
   * @default false
   */
  clearable?: boolean;
  /**
   * Custom class names for the component.
   */
  classNames?: {
    /**
     * Custom class names for the trigger (the button that opens the picker).
     */
    trigger?: string;
  };
  timePicker?: {
    hour?: boolean;
    minute?: boolean;
    second?: boolean;
  };
  /**
   * Custom render function for the trigger.
   */
  renderTrigger?: (props: DateTimeRenderTriggerProps) => React.ReactNode;
};

export type DateTimeRenderTriggerProps = {
  value: Date | undefined;
  open: boolean;
  timezone?: string;
  disabled?: boolean;
  use12HourFormat?: boolean;
  setOpen: (open: boolean) => void;
  hideSeconds?: boolean;
};

export function DateTimePicker({
  value,
  onChange,
  renderTrigger,
  min,
  max,
  timezone,
  hideTime,
  use12HourFormat,
  disabled,
  clearable,
  classNames,
  timePicker,
  hideSeconds,
  ...props
}: DateTimePickerProps & CalendarProps) {
  const [open, setOpen] = useState(false);
  const [monthYearPicker, setMonthYearPicker] = useState<
    'month' | 'year' | false
  >(false);
  const initDate = useMemo(
    () => new TZDate(value || new Date(), timezone),
    [value, timezone],
  );

  const [month, setMonth] = useState<Date>(initDate);

  const endMonth = useMemo(() => {
    return setYear(month, getYear(month) + 1);
  }, [month]);
  const minDate = useMemo(
    () => (min ? new TZDate(min, timezone) : undefined),
    [min, timezone],
  );
  const maxDate = useMemo(
    () => (max ? new TZDate(max, timezone) : undefined),
    [max, timezone],
  );

  const onDayChanged = useCallback(
    (d: Date) => {
      if (!d) return;
      const newDate = new Date(d);
      if (!value) {
        newDate.setHours(
          new Date().getHours(),
          new Date().getMinutes(),
          new Date().getSeconds(),
        );
      } else {
        newDate.setHours(
          value.getHours(),
          value.getMinutes(),
          value.getSeconds(),
        );
      }
      if (min && newDate < min) {
        newDate.setHours(min.getHours(), min.getMinutes(), min.getSeconds());
      }
      if (max && newDate > max) {
        newDate.setHours(max.getHours(), max.getMinutes(), max.getSeconds());
      }
      onChange(newDate);
    },
    [value, onChange, min, max],
  );

  const onMonthYearChanged = useCallback(
    (d: Date, mode: 'month' | 'year') => {
      setMonth(d);
      if (mode === 'year') {
        setMonthYearPicker('month');
      } else {
        setMonthYearPicker(false);
      }
    },
    [setMonth, setMonthYearPicker],
  );
  const onNextMonth = useCallback(() => {
    setMonth(addMonths(month, 1));
  }, [month]);
  const onPrevMonth = useCallback(() => {
    setMonth(subMonths(month, 1));
  }, [month]);

  useEffect(() => {
    if (open) {
      setMonth(initDate);
      setMonthYearPicker(false);
    }
  }, [open, initDate]);

  const displayValue = value;

  const dislayFormat = useMemo(() => {
    if (!displayValue) return 'Pick a date';
    return format(
      displayValue,
      `${!hideTime ? 'MMM' : 'MMMM'} d, yyyy${!hideTime ? (use12HourFormat ? ' hh:mm a' : ' HH:mm:ss') : ''}`,
    );
  }, [displayValue, hideTime, use12HourFormat]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {renderTrigger ? (
          renderTrigger({
            value: displayValue,
            open,
            timezone,
            disabled,
            use12HourFormat,
            setOpen,
          })
        ) : (
          <div
            className={cn(
              'flex h-9 w-full cursor-pointer items-center rounded-md border border-input pe-1 ps-3 text-sm font-normal shadow-sm',
              !displayValue && 'text-muted-foreground',
              (!clearable || !value) && 'pe-3',
              disabled && 'pointer-events-none cursor-not-allowed opacity-50',
              classNames?.trigger,
            )}
            tabIndex={0}
          >
            <div className="flex flex-grow items-center">
              <CalendarIcon className="mr-2 size-4" />
              {dislayFormat}
            </div>
            {clearable && value && (
              <Button
                disabled={disabled}
                variant="ghost"
                size="sm"
                role="button"
                aria-label="Clear date"
                className="ms-1 size-6 p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                <XCircle className="size-4" />
              </Button>
            )}
          </div>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex items-center justify-between">
          <div className="ms-2 flex cursor-pointer items-center text-sm font-medium">
            <div>
              <span
                onClick={() =>
                  setMonthYearPicker(
                    monthYearPicker === 'month' ? false : 'month',
                  )
                }
              >
                {format(month, 'MMMM')}
              </span>
              <span
                className="ms-1"
                onClick={() =>
                  setMonthYearPicker(
                    monthYearPicker === 'year' ? false : 'year',
                  )
                }
              >
                {format(month, 'yyyy')}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setMonthYearPicker(monthYearPicker ? false : 'year')
              }
            >
              {monthYearPicker ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </Button>
          </div>
          <div
            className={cn('flex space-x-2', monthYearPicker ? 'hidden' : '')}
          >
            <Button variant="ghost" size="icon" onClick={onPrevMonth}>
              <ChevronLeftIcon />
            </Button>
            <Button variant="ghost" size="icon" onClick={onNextMonth}>
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
        <div className="relative overflow-hidden">
          <DayPicker
            timeZone={timezone}
            mode="single"
            selected={value}
            onSelect={(d) => d && onDayChanged(d)}
            month={month}
            endMonth={endMonth}
            disabled={
              [
                max ? { after: max } : null,
                min ? { before: min } : null,
              ].filter(Boolean) as Matcher[]
            }
            onMonthChange={setMonth}
            classNames={{
              dropdowns: 'flex w-full gap-2',
              months: 'flex w-full h-fit',
              month: 'flex flex-col w-full',
              month_caption: 'hidden',
              button_previous: 'hidden',
              button_next: 'hidden',
              month_grid: 'w-full border-collapse',
              weekdays: 'flex justify-between mt-2',
              weekday:
                'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
              week: 'flex w-full justify-between mt-2',
              day: 'h-9 w-9 text-center text-sm p-0 relative flex items-center justify-center [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 rounded-1',
              day_button: cn(
                buttonVariants({ variant: 'ghost' }),
                'size-9 rounded-md p-0 font-normal aria-selected:opacity-100',
              ),
              range_end: 'day-range-end',
              selected:
                'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-l-md rounded-r-md',
              today: 'bg-accent text-accent-foreground',
              outside:
                'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
              disabled: 'text-muted-foreground opacity-50',
              range_middle:
                'aria-selected:bg-accent aria-selected:text-accent-foreground',
              hidden: 'invisible',
            }}
            showOutsideDays={true}
            {...props}
          />
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 top-0',
              monthYearPicker ? 'bg-popover' : 'hidden',
            )}
          ></div>
          <MonthYearPicker
            value={month}
            mode={monthYearPicker as any}
            onChange={onMonthYearChanged}
            minDate={minDate}
            maxDate={maxDate}
            className={cn(
              'absolute bottom-0 left-0 right-0 top-0',
              monthYearPicker ? '' : 'hidden',
            )}
          />
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {!hideTime && (
            <TimePicker
              hideSeconds={hideSeconds}
              timePicker={timePicker}
              value={value || new Date()}
              onChange={onChange}
              use12HourFormat={use12HourFormat}
              min={minDate}
              max={maxDate}
            />
          )}
          {timezone && (
            <div className="text-sm">
              <span>Timezone:</span>
              <span className="ms-1 font-semibold">{timezone}</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MonthYearPicker({
  value,
  minDate,
  maxDate,
  mode = 'month',
  onChange,
  className,
}: {
  value: Date;
  mode: 'month' | 'year';
  minDate?: Date;
  maxDate?: Date;
  onChange: (value: Date, mode: 'month' | 'year') => void;
  className?: string;
}) {
  const yearRef = useRef<HTMLDivElement>(null);
  const years = useMemo(() => {
    const years: TimeOption[] = [];
    for (let i = 1912; i < 2100; i++) {
      let disabled = false;
      const startY = startOfYear(setYear(value, i));
      const endY = endOfYear(setYear(value, i));
      if (minDate && endY < minDate) disabled = true;
      if (maxDate && startY > maxDate) disabled = true;
      years.push({ value: i, label: i.toString(), disabled });
    }
    return years;
  }, [value]);
  const months = useMemo(() => {
    const months: TimeOption[] = [];
    for (let i = 0; i < 12; i++) {
      let disabled = false;
      const startM = startOfMonth(setMonthFns(value, i));
      const endM = endOfMonth(setMonthFns(value, i));
      if (minDate && endM < minDate) disabled = true;
      if (maxDate && startM > maxDate) disabled = true;
      months.push({ value: i, label: format(new Date(0, i), 'MMM'), disabled });
    }
    return months;
  }, [value]);

  const onYearChange = useCallback(
    (v: TimeOption) => {
      let newDate = setYear(value, v.value);
      if (minDate && newDate < minDate) {
        newDate = setMonthFns(newDate, getMonth(minDate));
      }
      if (maxDate && newDate > maxDate) {
        newDate = setMonthFns(newDate, getMonth(maxDate));
      }
      onChange(newDate, 'year');
    },
    [onChange, value, minDate, maxDate],
  );

  useEffect(() => {
    if (mode === 'year') {
      yearRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
    }
  }, [mode, value]);
  return (
    <div className={cn(className)}>
      <ScrollArea className="h-full">
        {mode === 'year' && (
          <div className="grid grid-cols-4">
            {years.map((year) => (
              <div
                key={year.value}
                ref={year.value === getYear(value) ? yearRef : undefined}
              >
                <Button
                  disabled={year.disabled}
                  variant={getYear(value) === year.value ? 'default' : 'ghost'}
                  className="rounded-full"
                  onClick={() => onYearChange(year)}
                >
                  {year.label}
                </Button>
              </div>
            ))}
          </div>
        )}
        {mode === 'month' && (
          <div className="grid grid-cols-3 gap-4">
            {months.map((month) => (
              <Button
                key={month.value}
                size="lg"
                disabled={month.disabled}
                variant={getMonth(value) === month.value ? 'default' : 'ghost'}
                className="rounded-full"
                onClick={() =>
                  onChange(setMonthFns(value, month.value), 'month')
                }
              >
                {month.label}
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface TimeOption {
  value: number;
  label: string;
  disabled: boolean;
}

function TimePicker({
  value,
  onChange,
  use12HourFormat,
  min,
  max,
  timePicker,
  hideSeconds,
}: {
  use12HourFormat?: boolean;
  value: Date;
  onChange: (date: Date) => void;
  min?: Date;
  max?: Date;
  timePicker?: DateTimePickerProps['timePicker'];
  hideSeconds?: DateTimePickerProps['hideSeconds'];
}) {
  // hours24h = HH
  // hours12h = hh
  const formatStr = useMemo(
    () =>
      use12HourFormat
        ? 'yyyy-MM-dd hh:mm:ss.SSS a xxxx'
        : 'yyyy-MM-dd HH:mm:ss.SSS xxxx',
    [use12HourFormat],
  );
  const [ampm, setAmpm] = useState(
    format(value, 'a') === 'AM' ? AM_VALUE : PM_VALUE,
  );
  const [hour, setHour] = useState(
    use12HourFormat ? +format(value, 'hh') : value.getHours(),
  );
  const [minute, setMinute] = useState(value.getMinutes());
  const [second, setSecond] = useState(value.getSeconds());

  useEffect(() => {
    onChange(
      buildTime({
        use12HourFormat,
        value,
        formatStr,
        hour,
        minute,
        second,
        ampm,
      }),
    );
  }, [hour, minute, second, ampm, formatStr, use12HourFormat]);

  const _hourIn24h = useMemo(() => {
    // if (use12HourFormat) {
    //   return (hour % 12) + ampm * 12;
    // }
    return use12HourFormat ? (hour % 12) + ampm * 12 : hour;
  }, [value, use12HourFormat, ampm]);

  const hours: TimeOption[] = useMemo(
    () =>
      Array.from({ length: use12HourFormat ? 12 : 24 }, (_, i) => {
        let disabled = false;
        const hourValue = use12HourFormat ? (i === 0 ? 12 : i) : i;
        const hDate = setHours(value, use12HourFormat ? i + ampm * 12 : i);
        const hStart = startOfHour(hDate);
        const hEnd = endOfHour(hDate);
        if (min && hEnd < min) disabled = true;
        if (max && hStart > max) disabled = true;
        return {
          value: hourValue,
          label: hourValue.toString().padStart(2, '0'),
          disabled,
        };
      }),
    [value, min, max, use12HourFormat, ampm],
  );
  const minutes: TimeOption[] = useMemo(() => {
    const anchorDate = setHours(value, _hourIn24h);
    return Array.from({ length: 60 }, (_, i) => {
      let disabled = false;
      const mDate = setMinutes(anchorDate, i);
      const mStart = startOfMinute(mDate);
      const mEnd = endOfMinute(mDate);
      if (min && mEnd < min) disabled = true;
      if (max && mStart > max) disabled = true;
      return {
        value: i,
        label: i.toString().padStart(2, '0'),
        disabled,
      };
    });
  }, [value, min, max, _hourIn24h]);
  const seconds: TimeOption[] = useMemo(() => {
    const anchorDate = setMilliseconds(
      setMinutes(setHours(value, _hourIn24h), minute),
      0,
    );
    const _min = min ? setMilliseconds(min, 0) : undefined;
    const _max = max ? setMilliseconds(max, 0) : undefined;
    return Array.from({ length: 60 }, (_, i) => {
      let disabled = false;
      const sDate = setSeconds(anchorDate, i);
      if (_min && sDate < _min) disabled = true;
      if (_max && sDate > _max) disabled = true;
      return {
        value: i,
        label: i.toString().padStart(2, '0'),
        disabled,
      };
    });
  }, [value, minute, min, max, _hourIn24h]);
  const ampmOptions = useMemo(() => {
    const startD = startOfDay(value);
    const endD = endOfDay(value);
    return [
      { value: AM_VALUE, label: 'AM' },
      { value: PM_VALUE, label: 'PM' },
    ].map((v) => {
      let disabled = false;
      const start = addHours(startD, v.value * 12);
      const end = subHours(endD, (1 - v.value) * 12);
      if (min && end < min) disabled = true;
      if (max && start > max) disabled = true;
      return { ...v, disabled };
    });
  }, [value, min, max]);

  const [open, setOpen] = useState(false);

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (open) {
        hourRef.current?.scrollIntoView({ behavior: 'auto' });
        minuteRef.current?.scrollIntoView({ behavior: 'auto' });
        secondRef.current?.scrollIntoView({ behavior: 'auto' });
      }
    }, 1);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onHourChange = useCallback(
    (v: TimeOption) => {
      if (min) {
        const newTime = buildTime({
          use12HourFormat,
          value,
          formatStr,
          hour: v.value,
          minute,
          second,
          ampm,
        });
        if (newTime < min) {
          setMinute(min.getMinutes());
          setSecond(min.getSeconds());
        }
      }
      if (max) {
        const newTime = buildTime({
          use12HourFormat,
          value,
          formatStr,
          hour: v.value,
          minute,
          second,
          ampm,
        });
        if (newTime > max) {
          setMinute(max.getMinutes());
          setSecond(max.getSeconds());
        }
      }
      setHour(v.value);
    },
    [setHour, use12HourFormat, value, formatStr, minute, second, ampm],
  );

  const onMinuteChange = useCallback(
    (v: TimeOption) => {
      if (min) {
        const newTime = buildTime({
          use12HourFormat,
          value,
          formatStr,
          hour: v.value,
          minute,
          second,
          ampm,
        });
        if (newTime < min) {
          setSecond(min.getSeconds());
        }
      }
      if (max) {
        const newTime = buildTime({
          use12HourFormat,
          value,
          formatStr,
          hour: v.value,
          minute,
          second,
          ampm,
        });
        if (newTime > max) {
          setSecond(newTime.getSeconds());
        }
      }
      setMinute(v.value);
    },
    [setMinute, use12HourFormat, value, formatStr, hour, second, ampm],
  );

  const onAmpmChange = useCallback(
    (v: TimeOption) => {
      if (min) {
        const newTime = buildTime({
          use12HourFormat,
          value,
          formatStr,
          hour,
          minute,
          second,
          ampm: v.value,
        });
        if (newTime < min) {
          const minH = min.getHours() % 12;
          setHour(minH === 0 ? 12 : minH);
          setMinute(min.getMinutes());
          setSecond(min.getSeconds());
        }
      }
      if (max) {
        const newTime = buildTime({
          use12HourFormat,
          value,
          formatStr,
          hour,
          minute,
          second,
          ampm: v.value,
        });
        if (newTime > max) {
          const maxH = max.getHours() % 12;
          setHour(maxH === 0 ? 12 : maxH);
          setMinute(max.getMinutes());
          setSecond(max.getSeconds());
        }
      }
      setAmpm(v.value);
    },
    [
      setAmpm,
      use12HourFormat,
      value,
      formatStr,
      hour,
      minute,
      second,
      min,
      max,
    ],
  );

  const display = useMemo(() => {
    const arr = [];
    for (const element of ['hour', 'minute', 'second']) {
      if (!timePicker || timePicker[element as keyof typeof timePicker]) {
        if (element === 'hour') {
          arr.push(use12HourFormat ? 'hh' : 'HH');
        } else {
          arr.push(element === 'minute' ? 'mm' : 'ss');
        }
      }
    }
    return format(value, arr.join(':') + (use12HourFormat ? ' a' : ''));
  }, [value, use12HourFormat, timePicker]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between"
        >
          <Clock className="mr-2 size-4" />
          {display}
          <ChevronDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" side="top">
        <div className="flex-col gap-2 p-2">
          <div className="flex h-56 grow">
            {(!timePicker || timePicker.hour) && (
              <ScrollArea className="h-full flex-grow">
                <div className="flex grow flex-col items-stretch overflow-y-auto pb-48 pe-2">
                  {hours.map((v) => (
                    <div
                      key={v.value}
                      ref={v.value === hour ? hourRef : undefined}
                    >
                      <TimeItem
                        option={v}
                        selected={v.value === hour}
                        onSelect={onHourChange}
                        className="h-8"
                        disabled={v.disabled}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            {(!timePicker || timePicker.minute) && (
              <ScrollArea className="h-full flex-grow">
                <div className="flex grow flex-col items-stretch overflow-y-auto pb-48 pe-2">
                  {minutes.map((v) => (
                    <div
                      key={v.value}
                      ref={v.value === minute ? minuteRef : undefined}
                    >
                      <TimeItem
                        option={v}
                        selected={v.value === minute}
                        onSelect={onMinuteChange}
                        className="h-8"
                        disabled={v.disabled}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            {(!timePicker || timePicker.second) && !hideSeconds && (
              <ScrollArea className="h-full flex-grow">
                <div className="flex grow flex-col items-stretch overflow-y-auto pb-48 pe-2">
                  {seconds.map((v) => (
                    <div
                      key={v.value}
                      ref={v.value === second ? secondRef : undefined}
                    >
                      <TimeItem
                        option={v}
                        selected={v.value === second}
                        onSelect={(v) => setSecond(v.value)}
                        className="h-8"
                        disabled={v.disabled}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            {use12HourFormat && (
              <ScrollArea className="h-full flex-grow">
                <div className="flex grow flex-col items-stretch overflow-y-auto pe-2">
                  {ampmOptions.map((v) => (
                    <TimeItem
                      key={v.value}
                      option={v}
                      selected={v.value === ampm}
                      onSelect={onAmpmChange}
                      className="h-8"
                      disabled={v.disabled}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const TimeItem = ({
  option,
  selected,
  onSelect,
  className,
  disabled,
}: {
  option: TimeOption;
  selected: boolean;
  onSelect: (option: TimeOption) => void;
  className?: string;
  disabled?: boolean;
}) => {
  return (
    <Button
      variant="ghost"
      className={cn('flex justify-center px-1 pe-2 ps-1', className)}
      onClick={() => onSelect(option)}
      disabled={disabled}
    >
      <div className="w-4">
        {selected && <CheckIcon className="my-auto size-4" />}
      </div>
      <span className="ms-2">{option.label}</span>
    </Button>
  );
};

interface BuildTimeOptions {
  use12HourFormat?: boolean;
  value: Date;
  formatStr: string;
  hour: number;
  minute: number;
  second: number;
  ampm: number;
}

function buildTime(options: BuildTimeOptions) {
  const { use12HourFormat, value, formatStr, hour, minute, second, ampm } =
    options;
  let date: Date;
  if (use12HourFormat) {
    const dateStrRaw = format(value, formatStr);
    // yyyy-MM-dd hh:mm:ss.SSS a zzzz
    // 2024-10-14 01:20:07.524 AM GMT+00:00
    let dateStr =
      dateStrRaw.slice(0, 11) +
      hour.toString().padStart(2, '0') +
      dateStrRaw.slice(13);
    dateStr =
      dateStr.slice(0, 14) +
      minute.toString().padStart(2, '0') +
      dateStr.slice(16);
    dateStr =
      dateStr.slice(0, 17) +
      second.toString().padStart(2, '0') +
      dateStr.slice(19);
    dateStr =
      dateStr.slice(0, 24) +
      (ampm == AM_VALUE ? 'AM' : 'PM') +
      dateStr.slice(26);
    date = parse(dateStr, formatStr, value);
  } else {
    date = setHours(setMinutes(setSeconds(value, second), minute), hour);
  }
  return date;
}

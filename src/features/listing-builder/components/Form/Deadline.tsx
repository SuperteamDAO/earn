import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAtomValue } from "jotai";
import { formAtom, isEditingAtom, isGodAtom } from "../../atoms";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

const deadlineOptions = [
  { label: '1 Week', value: 7 },
  { label: '2 Weeks', value: 14 },
  { label: '3 Weeks', value: 21 },
];

export const DEADLINE_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'

export function Deadline() {
  const form = useAtomValue(formAtom)
  const listing = form?.getValues()

  const [maxDeadline, setMaxDeadline] = useState<Date | undefined>(undefined);
  const [minDeadline, setMinDeadline] = useState<Date | undefined>(new Date());

  const editable = useAtomValue(isEditingAtom);
  const isGod = useAtomValue(isGodAtom);

  useEffect(() => {
    if (editable && listing?.deadline) {
      const originalDeadline = dayjs(listing?.deadline);
      const twoWeeksLater = originalDeadline.add(2, 'weeks');
      setMaxDeadline(twoWeeksLater.toDate());
    }
  }, [editable]);

  useEffect(() => {
    if(isGod) setMinDeadline(undefined)
    else setMinDeadline(new Date())
  },[isGod])

  const handleDeadlineSelection = (days: number) => {
    return dayjs().add(days, 'day').format(DEADLINE_FORMAT);
  };

  useEffect(() => {
    // TODO: Debug why zod default for deadline specifically is not working
    if(form) {
      if(!form.getValues().deadline)
        form.setValue('deadline',handleDeadlineSelection(Number(7)))
    }
  }, [form]);

  return (
    <FormField
      name='deadline'
      control={form?.control}
      render={({field}) => {
        return (
          <FormItem className="">
            <FormLabel>Deadline</FormLabel>
            <div className="flex border rounded-md ring-primary has-[:focus]:ring-1 has-[data-[state=open]]:ring-1">
              <DateTimePicker value={field.value ? new Date(field.value) : undefined} 
                onChange={(date) => {
                  console.log('DateTimePicker date', date)
                  if (date) {
                    const formattedDate = dayjs(date).format(DEADLINE_FORMAT);
                    field.onChange(formattedDate);
                  } else {
                    field.onChange(undefined);
                  }
                }}
                use12HourFormat hideSeconds
                max={maxDeadline ? (maxDeadline) : undefined}
                min={minDeadline ? (minDeadline) : undefined}
                classNames={{
                  trigger: 'border-0',
                }}
              />
              <Select onValueChange={(data) => {
                field.onChange(handleDeadlineSelection(Number(data)))
                }}
               defaultValue={'7'}>
                <SelectTrigger className='border-0 w-32 rounded-none focus:ring-0 border-l '>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deadlineOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value+''}>
                      <div className="flex items-center gap-2 text-xs pl-2 text-slate-500">
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  );
}


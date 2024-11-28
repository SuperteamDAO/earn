import { CompensationType } from '@prisma/client';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useListingForm } from '../../../hooks';

const paymentTypes: { value: CompensationType; label: string }[] = [
  { value: CompensationType.fixed, label: 'Fixed' },
  { value: CompensationType.range, label: 'Range' },
  { value: CompensationType.variable, label: 'Variable' },
];

const descriptionByType = (type: CompensationType) => {
  switch (type) {
    case CompensationType.fixed:
      return 'Fixed compensation decided by you ';
    case CompensationType.range:
      return 'Applicants will send you quotes within the range';
    case CompensationType.variable:
      return 'Applicants can send you quotes of any amount';
  }
};

export function PaymentType() {
  const form = useListingForm();
  return (
    <FormField
      name="compensationType"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem className="flex flex-row items-center justify-between">
            <div className="">
              <FormLabel className="">Payment Type</FormLabel>
              <FormDescription>
                {descriptionByType(field.value)}
              </FormDescription>
            </div>
            <FormControl className="flex items-center">
              <Select
                onValueChange={(e) => {
                  field.onChange(e);
                  if (e !== 'fixed') {
                    form.setValue('rewardAmount', undefined);
                  }
                  form.saveDraft();
                }}
                value={field.value}
              >
                <SelectTrigger className="w-32 text-slate-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map(({ value, label }) => (
                    <SelectItem
                      key={value}
                      value={value}
                      className="text-xs text-slate-500"
                    >
                      {label}
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

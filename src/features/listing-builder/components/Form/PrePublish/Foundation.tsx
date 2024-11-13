import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

import { useListingForm } from '../../../hooks';

export function Foundation() {
  const form = useListingForm();
  if (!form) return null;
  return (
    <FormField
      name="isFndnPaying"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              <FormLabel className="font-semibold text-slate-500">
                Payment via Solana Foundation?
              </FormLabel>
              <FormDescription>
                Will Solana Foundation pay for this Listing?
              </FormDescription>
            </div>
            <FormControl className="flex items-center">
              <Switch
                checked={field.value}
                onCheckedChange={(e) => {
                  field.onChange(e);
                  form.onChange();
                }}
              />
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
}

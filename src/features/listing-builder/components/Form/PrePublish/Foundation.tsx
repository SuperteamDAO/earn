import { useWatch } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Tooltip } from '@/components/ui/tooltip';
import { isInKindReward } from '@/lib/rewards/inKind';
import { cn } from '@/utils/cn';

import { useListingForm } from '../../../hooks';

export function Foundation() {
  const form = useListingForm();
  const token = useWatch({
    control: form.control,
    name: 'token',
  });
  const isDisabled = isInKindReward(token);
  const disabledTooltip = "In-kind rewards can't be paid for by the foundation";
  if (!form) return null;
  return (
    <FormField
      name="isFndnPaying"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem className="flex flex-row items-center justify-between">
            <div className={cn(isDisabled && 'text-slate-400')}>
              <FormLabel className={cn(isDisabled && 'text-slate-400')}>
                Payment via Solana Foundation?
              </FormLabel>
              <FormDescription className={cn(isDisabled && 'text-slate-400')}>
                Will Solana Foundation pay for this Listing?
              </FormDescription>
            </div>
            <FormControl className="flex items-center">
              <div
                className={cn('relative', isDisabled && 'cursor-not-allowed')}
              >
                <Switch
                  checked={isDisabled ? false : field.value}
                  disabled={isDisabled}
                  onCheckedChange={(e) => {
                    field.onChange(e);
                    form.saveDraft();
                  }}
                />
                {isDisabled && (
                  <Tooltip
                    content={disabledTooltip}
                    triggerClassName="absolute inset-0 z-10 cursor-not-allowed rounded-full bg-transparent"
                  >
                    <span className="sr-only">{disabledTooltip}</span>
                  </Tooltip>
                )}
              </div>
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
}

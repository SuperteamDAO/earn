import { PopoverContent } from '@radix-ui/react-popover';
import { Info } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { SkillsSelect } from '@/components/shared/SkillsSelectNew';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip } from '@/components/ui/tooltip';
import { useBreakpoint } from '@/hooks/use-breakpoint';

import { type NewTalentFormData } from '@/features/talent/schema';

interface Props {
  skillsRefreshKey: number;
}
export function SkillsField({ skillsRefreshKey }: Props) {
  const form = useFormContext<NewTalentFormData>();
  const { control, trigger } = form;

  const isMD = useBreakpoint('md');

  return (
    <FormField
      name="skills"
      control={control}
      render={({ field }) => {
        return (
          <FormItem className="mb-5 gap-2">
            <div>
              <span className="flex items-center gap-2">
                <FormLabel isRequired>Skills Needed</FormLabel>
                {isMD ? (
                  <Tooltip content="Select all that apply">
                    <Info className="h-3 w-3 text-slate-500" />
                  </Tooltip>
                ) : (
                  <Popover>
                    <PopoverTrigger>
                      <Info className="h-3 w-3 text-slate-500" />
                    </PopoverTrigger>
                    <PopoverContent className="rounded-md border bg-gray-50 px-3 py-1.5 text-xs text-slate-700">
                      Select all that apply
                    </PopoverContent>
                  </Popover>
                )}
              </span>
              <FormDescription>
                We will send email notifications of new listings for your
                selected skills
              </FormDescription>
            </div>
            <FormControl>
              <SkillsSelect
                key={skillsRefreshKey}
                ref={field.ref}
                defaultValue={field.value || []}
                onChange={(e) => {
                  field.onChange(e);
                  trigger('skills');
                }}
                maxSuggestions={5}
              />
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
}

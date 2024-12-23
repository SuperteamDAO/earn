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
import { Tooltip } from '@/components/ui/tooltip';

import { type NewTalentFormData } from '@/features/talent/schema';

interface Props {
  skillsRefreshKey: number;
}
export function SkillsField({ skillsRefreshKey }: Props) {
  const form = useFormContext<NewTalentFormData>();
  const { control, trigger } = form;

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
                <Tooltip content="Select all that apply">
                  <Info className="h-3 w-3 text-slate-500" />
                </Tooltip>
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
              />
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
}

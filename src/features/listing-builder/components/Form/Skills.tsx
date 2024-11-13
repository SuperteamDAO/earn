import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import { SkillsSelect } from '@/components/shared/SkillsSelectNew';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { useListingForm } from '../../hooks';

export function Skills() {
  const form = useListingForm();

  const templateId = useWatch({
    control: form.control,
    name: 'templateId',
  });

  const skillsKey = useMemo(() => `editor-${templateId}`, [templateId]);
  return (
    <FormField
      name="skills"
      control={form?.control}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel>Skills Needed</FormLabel>
            <FormControl>
              <SkillsSelect
                key={skillsKey}
                defaultValue={field.value || []}
                onChange={(e) => {
                  field.onChange(e);
                  form.onChange();
                  form.trigger('skills');
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

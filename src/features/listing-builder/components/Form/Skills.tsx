import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SkillsSelect } from "@/components/shared/SkillsSelectNew";
import { useListingForm } from "../../hooks";
import { useWatch } from "react-hook-form";
import { useMemo } from "react";

export function Skills() {
  const form = useListingForm()

  const templateId = useWatch({
    control: form.control,
    name: 'templateId'
  });

  const skillsKey = useMemo(() => `editor-${templateId}`, [templateId]);
  return (
    <FormField
      name='skills'
      control={form?.control}
      render={({field}) => {
        return (
          <FormItem  >
            <FormLabel>Skills Needed</FormLabel>
            <FormControl>
              <SkillsSelect
                key={skillsKey}
                defaultValue={field.value || []} 
                onChange={(e) => {
                  field.onChange(e)
                  form.onChange()
                  form.trigger('skills')
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  );
}


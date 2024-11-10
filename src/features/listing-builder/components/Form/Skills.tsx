import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SkillsSelect } from "@/components/shared/SkillsSelectNew";
import { useListingForm } from "../../hooks";

export function Skills() {
  const form = useListingForm()
  return (
    <FormField
      name='skills'
      control={form?.control}
      render={({field}) => {
        return (
          <FormItem  >
            <FormLabel>Skills Needed</FormLabel>
            <FormControl>
              <SkillsSelect defaultValue={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  );
}


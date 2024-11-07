import { useAtomValue } from "jotai";
import { formAtom } from "../../atoms";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SkillsSelect } from "@/components/shared/SkillsSelectNew";

export function Skills() {
  const form = useAtomValue(formAtom)
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


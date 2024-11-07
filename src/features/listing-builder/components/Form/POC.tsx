import { Input } from "@/components/ui/input";
import { useAtomValue } from "jotai";
import { formAtom } from "../../atoms";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export function POC() {
  const form = useAtomValue(formAtom)
  return (
    <FormField
      name='pocSocials'
      control={form?.control}
      render={({field}) => {
        return (
          <FormItem  >
            <FormLabel>Point of Contact</FormLabel>
            <FormControl>
              <Input placeholder='yb@superteamearn.com' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  );
}


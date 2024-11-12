import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { useListingForm } from "../../../hooks";
import { Switch } from "@/components/ui/switch";

export function Foundation() {
  const form = useListingForm()
  if(!form) return null
  return (
    <FormField
      name='isFndnPaying'
      control={form.control}
      render={({field}) => {
        return (
          <FormItem className='flex justify-between items-center'>
            <div className="text-xs text-slate-400">
              <FormLabel className='text-slate-500 font-semibold'>Payment via Solana Foundation?</FormLabel>
              <FormDescription>
                Will Solana Foundation pay for this Listing?
              </FormDescription>
            </div>
            <FormControl className='flex items-center'>
              <Switch
                checked={field.value}
                onCheckedChange={(e) => {
                  field.onChange(e)
                  form.onChange()
                }}
              />
            </FormControl>
          </FormItem>
        )
      }}
    />
  )
}

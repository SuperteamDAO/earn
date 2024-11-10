import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useListingForm } from "@/features/listing-builder/hooks"
import { TokenNumberInput } from "../Tokens"

export function Range() {
  const form = useListingForm()
  return (
    <div className='flex'>
      <FormField
        control={form.control}
        name='minRewardAsk'
        render={({field}) => (
          <FormItem>
            <FormLabel>From</FormLabel>
            <FormControl>
              <TokenNumberInput
                {...field}
                placeholder='5,000'
                className='rounded-r-none relative focus-within:z-10'
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='maxRewardAsk'
        render={({field}) => (
          <FormItem>
            <FormLabel>To</FormLabel>
            <FormControl>
              <TokenNumberInput
                {...field}
                placeholder='10,000'
                className='rounded-l-none relative focus-within:z-10 pr-6'
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}


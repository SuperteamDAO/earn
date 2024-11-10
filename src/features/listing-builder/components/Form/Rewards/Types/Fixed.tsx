import {TokenNumberInput} from "../Tokens";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, useFormField } from "@/components/ui/form";
import { useListingForm } from "@/features/listing-builder/hooks";
import { useEffect } from "react";
import { useWatch } from "react-hook-form";

export function Fixed() {
  const form = useListingForm()

  const rewards = useWatch({
    control: form.control,
    name: 'rewards',
  }) ;
  useEffect(() => {
    console.log('rewards', rewards)
  },[rewards])
  return (
  <FormField
      control={form.control}
      name={'rewardAmount'}
      render={({field}) => (
        <FormItem>
          <FormLabel>Fixed Prize</FormLabel>
          <FormControl>
            <TokenNumberInput
              {...field}
              placeholder='10,000'
              className='pr-6'
              onChange={(e) => {
                field.onChange(e)
                form.setValue(`rewards.${1}`, e || NaN)
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

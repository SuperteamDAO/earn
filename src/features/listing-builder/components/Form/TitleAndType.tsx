import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getListingIcon } from "@/features/listings";
import { useAtomValue } from "jotai";
import { formAtom } from "../../atoms";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect } from "react";

const typeOptions = [
  { value: 'bounty', label: 'Bounty' },
  { value: 'project', label: 'Project' },
  { value: 'hackathon', label: 'Hackathon' },
] as const;

export function TitleAndType() {
  const form = useAtomValue(formAtom)
  return (
    <FormField
      name='title'
      control={form?.control}
      render={({field}) => {
        return (
          <FormItem >
            <FormLabel>Listing Title</FormLabel>
            <div className="flex border rounded-md ring-primary has-[:focus]:ring-1">
              <Type />
              <FormControl>
                <Input placeholder='Develop Something on solana' {...field} 
                  className='border-none focus-visible:ring-0'
                  defaultValue={''}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  );
}

function Type() {
  const form = useAtomValue(formAtom)
  const type = form?.watch('type')
  useEffect(() => {
    console.log('type', type)
  },[type])
  return (
    <FormField
      name='type'
      control={form?.control}
      render={({field}) => {
        return (
          <FormItem >
            <FormControl>
              <Select onValueChange={field.onChange} defaultValue={field.value} >
                <SelectTrigger className='border-0 w-32 rounded-none focus:ring-0 border-r'>
                  <div className="flex items-center gap-2">
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2 text-xs">
                        <img 
                          src={getListingIcon(value)} 
                          alt={value}
                          className="h-4 w-4" 
                        />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        )
      }}
    />
  )
}

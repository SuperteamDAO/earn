import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { LockKeyhole, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListingForm } from "../../../hooks";

const visibilityTypes = [
  { value: "public", label: "Public", icon: Users  },
  { value: "private", label: "Private", icon: LockKeyhole },
];

export function Visibility() {
  const form = useListingForm()
  if(!form) return null
  return (
    <FormField
      name='isPrivate'
      control={form.control}
      render={({field}) => {
        return (
          <FormItem className='flex justify-between items-center'>
            <div className="text-xs text-slate-400">
              <FormLabel className='text-slate-500 font-semibold'>Visibility</FormLabel>
              <FormDescription>
                {field.value ?
                'Only accessible via the URL' 
                : 'Anyone can see this listing '}
              </FormDescription>
            </div>
            <FormControl className='flex items-center'>
              <Select onValueChange={(e) => {
                if(e === 'private') field.onChange(true)
                  else field.onChange(false)
              }} defaultValue={field.value ? 'private': 'public'} >
                <SelectTrigger className=' w-32 '>
                  <div className="flex items-center gap-2">
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {visibilityTypes.map(({ value, label, icon: Icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2 text-xs">
                        <Icon className="h-4 w-4 text-slate-500" />
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

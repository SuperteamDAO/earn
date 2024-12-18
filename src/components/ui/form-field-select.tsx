import { type Control, type FieldValues, type Path } from 'react-hook-form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils/cn';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';

interface SelectBoxProps<T extends FieldValues> {
  label: string;
  options: string[] | readonly string[];
  placeholder: string;
  control: Control<T>;
  name: Path<T>;
  required?: boolean;
  className?: string;
}

export const FormFieldSelect = <T extends FieldValues>({
  label,
  options,
  name,
  placeholder,
  control,
  required = false,
  className,
}: SelectBoxProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('mb-5 flex w-full flex-col gap-2', className)}>
          <div>
            {label && <FormLabel isRequired={required}>{label}</FormLabel>}
          </div>
          <div>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue
                    onBlur={field.onBlur}
                    placeholder={placeholder}
                  />
                </SelectTrigger>
                <SelectContent>
                  {!required && !!field.value && (
                    <SelectItem value={null!} className="text-slate-400">
                      {placeholder}
                    </SelectItem>
                  )}
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage className="pt-1" />
          </div>
        </FormItem>
      )}
    />
  );
};

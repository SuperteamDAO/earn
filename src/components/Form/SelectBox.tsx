import { type Control } from 'react-hook-form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils';

import { FormFieldWrapper } from '../ui/form-field-wrapper';

interface SelectBoxProps {
  label: string;
  options: string[] | readonly string[];
  name: string;
  placeholder: string;
  control: Control<any>;
  required?: boolean;
  className?: string;
}

export const SelectBox = ({
  label,
  options,
  name,
  placeholder,
  control,
  required = false,
  className,
}: SelectBoxProps) => {
  return (
    <FormFieldWrapper
      name={name}
      control={control}
      className={cn('mb-5 w-full', className)}
      label={label}
      isRequired={required}
    >
      <Select>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormFieldWrapper>
  );
};

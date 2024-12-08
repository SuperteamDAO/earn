import { type FieldErrors, type UseFormRegister } from 'react-hook-form';

import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils';

type InputFieldProps = {
  label: string;
  placeholder: string;
  name: string;
  register: UseFormRegister<any>;
  isInvalid?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validationErrorMessage?: string;
  isRequired?: boolean;
  errors: FieldErrors<any>;
  validate?: (value: string) => boolean | string;
};

export const InputField = ({
  label,
  placeholder,
  name,
  register,
  isInvalid = false,
  onChange,
  validationErrorMessage,
  validate,
  errors,
  isRequired = false,
}: InputFieldProps) => {
  const validateNonEmpty = (value: string) => {
    return value.trim() !== '' || 'This field is required';
  };

  const combinedValidate = (value: string) => {
    if (isRequired) {
      const nonEmptyResult = validateNonEmpty(value);
      if (nonEmptyResult !== true) {
        return nonEmptyResult;
      }
    }
    return validate ? validate(value) : true;
  };

  return (
    <FormItem className="mb-5 w-full">
      <FormLabel className="text-slate-500">{label}</FormLabel>
      <FormControl>
        <Input
          className={cn(
            'border-slate-300 text-gray-800',
            'placeholder:text-slate-300',
            'focus:border-brand-purple focus:ring-brand-purple',
            isInvalid || !!errors?.[name] ? 'border-red-500' : '',
          )}
          id={name}
          placeholder={placeholder}
          {...register(name, {
            required: isRequired ? 'This field is required' : false,
            validate: combinedValidate,
          })}
          onChange={onChange}
        />
      </FormControl>
      {isInvalid && validationErrorMessage && (
        <p className="text-sm text-red-500">{validationErrorMessage}</p>
      )}
      <FormMessage>
        {errors && errors[name] && errors[name]?.message?.toString()}
        {validationErrorMessage}
      </FormMessage>
    </FormItem>
  );
};

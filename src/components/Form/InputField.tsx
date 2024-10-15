import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Text,
} from '@chakra-ui/react';
import { type FieldErrors, type UseFormRegister } from 'react-hook-form';

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
    <FormControl
      w={'full'}
      mb={'1.25rem'}
      isInvalid={isInvalid || !!errors?.[name]}
    >
      <FormLabel color={'brand.slate.500'}>{label}</FormLabel>
      <Input
        color={'gray.800'}
        borderColor="brand.slate.300"
        _placeholder={{
          color: 'brand.slate.300',
        }}
        focusBorderColor="brand.purple"
        id={name}
        placeholder={placeholder}
        {...register(name, {
          required: isRequired ? 'This field is required' : false,
          validate: combinedValidate,
        })}
        isInvalid={isInvalid || !!errors?.[name]}
        onChange={onChange}
      />
      {isInvalid && validationErrorMessage && (
        <Text color={'red'} fontSize={'sm'}>
          {validationErrorMessage}
        </Text>
      )}
      <FormErrorMessage>
        {errors && errors[name] && errors[name]?.message?.toString()}
        {validationErrorMessage ? <>{validationErrorMessage}</> : <></>}
      </FormErrorMessage>
    </FormControl>
  );
};

import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Text,
} from '@chakra-ui/react';

type InputFieldProps = {
  label: string;
  placeholder: string;
  name: string;
  register: any;
  isInvalid?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validationErrorMessage?: string;
  isRequired?: boolean;
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
  isRequired = false,
}: InputFieldProps) => {
  return (
    <FormControl w={'full'} mb={'1.25rem'} isInvalid={isInvalid}>
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
        {...register(name, { required: isRequired, validate })}
        isInvalid={isInvalid}
        onChange={onChange}
      />
      {isInvalid && validationErrorMessage && (
        <Text color={'red'} fontSize={'sm'}>
          {validationErrorMessage}
        </Text>
      )}
      <FormErrorMessage>
        {validationErrorMessage ? <>{validationErrorMessage}</> : <></>}
      </FormErrorMessage>
    </FormControl>
  );
};

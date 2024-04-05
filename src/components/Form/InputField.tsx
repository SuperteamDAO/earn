import { Box, FormLabel, Input, Text } from '@chakra-ui/react';

type InputFieldProps = {
  label: string;
  placeholder: string;
  name: string;
  register: any;
  isInvalid?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validationErrorMessage?: string;
  isRequired?: boolean;
  value?: string;
};

export const InputField = ({
  label,
  placeholder,
  name,
  register,
  isInvalid = false,
  onChange,
  validationErrorMessage,
  isRequired = false,
  value,
}: InputFieldProps) => {
  return (
    <Box w={'full'} mb={'1.25rem'}>
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
        {...register(name, { required: isRequired })}
        isInvalid={isInvalid}
        onChange={onChange}
        value={value}
      />
      {isInvalid && validationErrorMessage && (
        <Text color={'red'} fontSize={'sm'}>
          {validationErrorMessage}
        </Text>
      )}
    </Box>
  );
};

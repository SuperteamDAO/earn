import { Box, FormLabel, Input, Text } from '@chakra-ui/react';

type InputFieldProps = {
  label: string;
  placeholder: string;
  name: string;
  register: any;
  isInvalid?: boolean;
  onChange?: () => void;
  validationErrorMessage?: string;
  isRequired?: boolean;
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
}: InputFieldProps) => (
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
      />
      {isInvalid && validationErrorMessage && (
        <Text color={'red'}>{validationErrorMessage}</Text>
      )}
    </Box>
  );

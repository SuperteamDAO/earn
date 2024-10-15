import { Box, FormLabel, Select } from '@chakra-ui/react';

interface SelectBoxProps {
  label: string;
  watchValue?: string;
  options: string[];
  id: string;
  placeholder: string;
  register: any;
  required?: boolean;
}

export const SelectBox = ({
  label,
  watchValue,
  options,
  id,
  placeholder,
  register,
  required = false,
}: SelectBoxProps) => {
  return (
    <Box w={'full'} mb={'1.25rem'}>
      <FormLabel color={'brand.slate.500'}>{label}</FormLabel>
      <Select
        color={watchValue?.length === 0 ? 'brand.slate.300' : ''}
        borderColor="brand.slate.300"
        _placeholder={{ color: 'brand.slate.300' }}
        focusBorderColor="brand.purple"
        id={id}
        placeholder={placeholder}
        {...register(id, { required })}
      >
        {options.map((option) => {
          return (
            <option key={option} value={option}>
              {option}
            </option>
          );
        })}
      </Select>
    </Box>
  );
};

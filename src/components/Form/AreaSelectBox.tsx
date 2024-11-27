import { Box, FormLabel } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import ReactSelect, { type SingleValue } from 'react-select';

import { chinaArea } from '@/constants';

interface AreaSelectBox {
  label: string;
  watchValue?: string;
  id: string;
  placeholder: string;
  register: any;
  required?: boolean;
}
interface CountryOption {
  value: string;
  label: string;
}

interface GroupedOption {
  label: string;
  options: CountryOption[];
}

type SelectOption = CountryOption | GroupedOption;

export const AreaSelectBox = ({
  label,
  watchValue,
  id,
  placeholder,
  register,
  required = false,
}: AreaSelectBox) => {
  const [selectedValue, setSelectedValue] = useState(watchValue);

  const selectOptions: SelectOption[] = useMemo(() => {
    const list = chinaArea.map((area) => ({
      label: area.name,
      options: area.children.map((city) => ({
        value: city.name,
        label: city.name,
      })),
    }));
    return [...list];
  }, []);

  useEffect(() => {
    setSelectedValue(watchValue);
  }, [watchValue]);

  return (
    <Box w={'full'} mb={'1.25rem'}>
      <FormLabel color={'brand.slate.500'}>{label}</FormLabel>
      <ReactSelect
        options={selectOptions}
        placeholder={placeholder}
        {...register(id, { required })}
        styles={{
          control: (base) => ({
            ...base,
            borderColor: 'brand.slate.300',
            '&:hover': { borderColor: 'brand.purple' },
            boxShadow: 'none',
          }),
          placeholder: (base) => ({
            ...base,
            color: 'brand.slate.300',
          }),
        }}
        value={selectOptions
          .flatMap((option) => ('options' in option ? option.options : option))
          .find((option) => option.value === selectedValue)}
        onChange={(newValue: SingleValue<any>) => {
          if (newValue) {
            setSelectedValue(newValue.value);
            register(id).onChange({
              target: { name: id, value: newValue.value },
            });
          }
        }}
      />
    </Box>
  );
};

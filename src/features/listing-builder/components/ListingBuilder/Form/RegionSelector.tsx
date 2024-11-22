import {
  Box,
  Flex,
  FormControl,
  FormErrorMessage,
  Text,
} from '@chakra-ui/react';
// import { Regions } from '@prisma/client';
import React, { useMemo } from 'react';
import { type Control, Controller, type FieldErrors } from 'react-hook-form';
import ReactSelect, { type GroupBase, type SingleValue } from 'react-select';

import { chinaArea } from '@/constants';

// import { CombinedRegions, Superteams } from '@/constants/Superteam';
import { ListingFormLabel, ListingTooltip } from '.';

interface CountryOption {
  value: string;
  label: string;
}

interface GroupedOption {
  label: string;
  options: CountryOption[];
}

type SelectOption = CountryOption | GroupedOption;

interface RegionSelectorProps {
  control: Control<any>;
  errors: FieldErrors;
}

const formatGroupLabel = (data: GroupBase<CountryOption>) => (
  <Flex align="center" justify="space-between">
    <Text fontWeight="bold">{data.label}</Text>
  </Flex>
);

export const RegionSelector: React.FC<RegionSelectorProps> = ({
  control,
  errors,
}) => {
  const options: SelectOption[] = useMemo(() => {
    const list = chinaArea.map((area) => ({
      label: area.name,
      options: area.children.map((city) => ({
        value: city.name,
        label: city.name,
      })),
    }));
    return [...list];
  }, []);

  return (
    <FormControl w="full" mb={5} isInvalid={!!errors.region}>
      <Flex>
        <ListingFormLabel htmlFor="region">城市</ListingFormLabel>
        <ListingTooltip label="" />
      </Flex>
      <Box>
        <Controller
          name="region"
          control={control}
          render={({ field: { onChange, value, ref } }) => (
            <ReactSelect<CountryOption, false, GroupedOption>
              options={options}
              formatGroupLabel={formatGroupLabel}
              placeholder=""
              ref={ref}
              value={options
                .flatMap((option) =>
                  'options' in option ? option.options : option,
                )
                .find((option) => option.value === value)}
              onChange={(newValue: SingleValue<CountryOption>) =>
                onChange(newValue?.value)
              }
            />
          )}
        />
      </Box>
      <FormErrorMessage>
        {errors.region && errors.region.message?.toString()}
      </FormErrorMessage>
    </FormControl>
  );
};

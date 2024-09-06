import {
  Box,
  type BoxProps,
  Flex,
  FormControl,
  Select,
  Text,
} from '@chakra-ui/react';
import {
  type Control,
  Controller,
  type UseFormSetValue,
} from 'react-hook-form';

import { ListingFormLabel, ListingTooltip } from '../Form';
import { type FormType } from './types';

interface Props extends BoxProps {
  control: Control<FormType>;
  setValue: UseFormSetValue<FormType>;
  compensationType: 'fixed' | 'range' | 'variable' | undefined;
}
export function SelectCompensationType({
  control,
  setValue,
  compensationType,
  ...props
}: Props) {
  let compensationHelperText;

  switch (compensationType) {
    case 'fixed':
      compensationHelperText =
        'Interested applicants will apply if the pay fits their expectations';
      break;
    case 'range':
      compensationHelperText =
        'Allow applicants to send quotes within a specific range';
      break;
    case 'variable':
      compensationHelperText = 'Allow applicants to send quotes of any amount';
      break;
  }
  return (
    <Box {...props}>
      <FormControl isRequired>
        <Flex>
          <ListingFormLabel htmlFor="compensationType">
            Compensation Type
          </ListingFormLabel>
          <ListingTooltip label="Would you like to keep a fixed compensation for this project, or let applicants send in their quotes?" />
        </Flex>
        <Controller
          control={control}
          name="compensationType"
          render={({ field: { onChange, value, ref } }) => (
            <Select
              ref={ref}
              h="2.8rem"
              color="brand.slate.900"
              borderColor="brand.slate.300"
              borderRadius={'sm'}
              onChange={(e: any) => {
                onChange(e);
                setValue('minRewardAsk', undefined);
                setValue('maxRewardAsk', undefined);
                setValue('rewards', undefined);
                setValue('rewardAmount', undefined);
              }}
              value={value}
            >
              <option hidden disabled value="">
                Select a Compensation Type
              </option>
              <option value="fixed">Fixed Compensation</option>
              <option value="range">Pre-decided Range</option>
              <option value="variable">Variable Compensation</option>
            </Select>
          )}
        />
      </FormControl>
      <Text mt={1} color="green.500" fontSize={'xs'}>
        {compensationHelperText}
      </Text>
    </Box>
  );
}

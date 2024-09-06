import {
  Flex,
  type FlexProps,
  FormControl,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';
import { type UseFormRegister } from 'react-hook-form';

import { ListingFormLabel } from '../Form';
import { SelectedToken } from './SelectedToken';
import { type FormType, type Token } from './types';

interface Props extends FlexProps {
  selectedToken: Token | undefined;
  register: UseFormRegister<FormType>;
}

export function RangeInput({ selectedToken, register, ...props }: Props) {
  return (
    <Flex {...props}>
      <FormControl w="full" mt={5} isRequired>
        <ListingFormLabel htmlFor="minRewardAsk">From</ListingFormLabel>
        <Flex
          pos="relative"
          pr={5}
          borderWidth={1}
          borderStyle={'solid'}
          borderColor="brand.slate.300"
          borderRadius={'sm'}
          _focusWithin={{
            borderColor: 'brand.purple',
          }}
        >
          <NumberInput
            w="full"
            color="brand.slate.500"
            border={'none'}
            focusBorderColor="rgba(0,0,0,0)"
            min={0}
          >
            <NumberInputField
              color={'brand.slate.800'}
              border={0}
              _focusWithin={{
                borderWidth: 0,
              }}
              _placeholder={{
                color: 'brand.slate.300',
              }}
              placeholder="Enter the lower range"
              {...register('minRewardAsk', {
                required: 'This field is required',
                setValueAs: (value) => parseFloat(value),
              })}
            />
          </NumberInput>
          <SelectedToken token={selectedToken} />
        </Flex>
      </FormControl>
      <FormControl w="full" mt={5} isRequired>
        <ListingFormLabel htmlFor="minRewardAsk">Upto</ListingFormLabel>
        <Flex
          pos="relative"
          pr={5}
          borderWidth={1}
          borderStyle={'solid'}
          borderColor="brand.slate.300"
          borderRadius={'sm'}
          _focusWithin={{
            borderColor: 'brand.purple',
          }}
        >
          <NumberInput
            w="full"
            color="brand.slate.500"
            border={'none'}
            focusBorderColor="rgba(0,0,0,0)"
            min={0}
          >
            <NumberInputField
              color={'brand.slate.800'}
              border={0}
              _focusWithin={{
                borderWidth: 0,
              }}
              _placeholder={{
                color: 'brand.slate.300',
              }}
              placeholder="Enter the higher range"
              {...register('maxRewardAsk', {
                required: 'This field is required',
                setValueAs: (value) => parseFloat(value),
              })}
            />
          </NumberInput>
          <SelectedToken token={selectedToken} />
        </Flex>
      </FormControl>
    </Flex>
  );
}

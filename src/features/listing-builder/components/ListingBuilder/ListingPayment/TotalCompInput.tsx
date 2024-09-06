import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import {
  Flex,
  FormControl,
  type FormControlProps,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/react';
import { type UseFormRegister } from 'react-hook-form';

import { MAX_PODIUMS, tokenList } from '@/constants';

import { ListingFormLabel } from '../Form';
import { SelectedToken } from './SelectedToken';
import { type FormType, type Token } from './types';

interface Props extends FormControlProps {
  token: string | undefined;
  selectedToken: Token | undefined;
  register: UseFormRegister<FormType>;
}
export function TotalCompInput({
  token,
  selectedToken,
  register,
  ...props
}: Props) {
  return (
    <FormControl {...props} w="full" mt={5} isRequired>
      <ListingFormLabel htmlFor="rewardAmount">
        Total Compensation (in{' '}
        {tokenList.find((t) => t.tokenSymbol === token)?.tokenSymbol})
      </ListingFormLabel>

      <Flex
        pos="relative"
        pr={4}
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
            {...register('rewardAmount', {
              required: 'This field is required',
              setValueAs: (value) => parseFloat(value),
            })}
            placeholder={(MAX_PODIUMS * 500).toString()}
          />
          <NumberInputStepper>
            <NumberIncrementStepper h={1} border={0}>
              <ChevronUpIcon w={4} h={4} />
            </NumberIncrementStepper>
            <NumberDecrementStepper h={1} border={0}>
              <ChevronDownIcon w={4} h={4} />
            </NumberDecrementStepper>
          </NumberInputStepper>
        </NumberInput>
        <SelectedToken token={selectedToken} />
      </Flex>
    </FormControl>
  );
}

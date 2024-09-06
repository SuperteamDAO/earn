import { ChevronDownIcon, ChevronUpIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  FormControl,
  type FormControlProps,
  FormHelperText,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
} from '@chakra-ui/react';

import { BONUS_REWARD_POSITION, MAX_BONUS_SPOTS } from '@/constants';
import { caculateBonus, formatTotalPrice } from '@/features/listing-builder';
import { type Rewards } from '@/features/listings';

import { SelectedToken } from './SelectedToken';
import { type PrizeListInterface, type Token } from './types';

type Props = FormControlProps & {
  el: PrizeListInterface;
  BONUS_REWARD_LABEL_2: string;
  selectedToken: Token | undefined;
  maxBonusSpots: number | undefined;
  rewards: Rewards | undefined;
  warningMessage: string | undefined;
  handleBonusChange: (bonus?: number) => void;
  handlePrizeValueChange: (prize: number, key: number) => void;
  handlePrizeDelete: (key: keyof Rewards) => void;
};
export function PrizeInput({
  el,
  BONUS_REWARD_LABEL_2,
  selectedToken,
  rewards,
  maxBonusSpots,
  warningMessage,
  handleBonusChange,
  handlePrizeDelete,
  handlePrizeValueChange,
  ...props
}: Props) {
  return (
    <FormControl key={el.value} {...props}>
      <Flex w="full">
        <FormLabel color={'gray.500'} textTransform="capitalize">
          {el.label}
        </FormLabel>
        {el.value === BONUS_REWARD_POSITION && (
          <FormLabel pl={8} color={'gray.500'} textTransform="capitalize">
            {BONUS_REWARD_LABEL_2}
          </FormLabel>
        )}
      </Flex>
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
        {el.value === BONUS_REWARD_POSITION && (
          <NumberInput
            w={'30%'}
            color="brand.slate.500"
            border={'none'}
            borderColor="brand.slate.300"
            borderRightWidth={'1px'}
            borderRightStyle={'solid'}
            defaultValue={maxBonusSpots ?? 1}
            focusBorderColor="rgba(0,0,0,0)"
            max={MAX_BONUS_SPOTS}
            min={1}
            onChange={(valueString) => handleBonusChange(parseInt(valueString))}
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
              placeholder={JSON.stringify(el.placeHolder)}
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
        )}
        <NumberInput
          w={el.value === BONUS_REWARD_POSITION ? '70%' : '100%'}
          color="brand.slate.500"
          border={'none'}
          focusBorderColor="rgba(0,0,0,0)"
          min={el.value === BONUS_REWARD_POSITION ? 0.01 : 0}
          onChange={(valueString) =>
            handlePrizeValueChange(el.value, parseFloat(valueString))
          }
          value={
            el.defaultValue !== null &&
            el.defaultValue !== undefined &&
            !isNaN(el.defaultValue)
              ? el.defaultValue
              : undefined
          }
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
            placeholder={JSON.stringify(el.placeHolder)}
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
        {el.value > 1 && (
          <Button
            pos="absolute"
            right={-12}
            px={0}
            onClick={() => {
              if (el.value === BONUS_REWARD_POSITION) {
                handleBonusChange(undefined);
              } else {
                handlePrizeDelete(el.value as keyof Rewards);
              }
            }}
            variant="ghost"
          >
            <DeleteIcon />
          </Button>
        )}
      </Flex>
      {!!warningMessage && el.value === BONUS_REWARD_POSITION && (
        <Text pt={2} color="yellow.500" fontSize="sm">
          {warningMessage}
        </Text>
      )}
      {el.value === BONUS_REWARD_POSITION &&
        !!rewards?.[BONUS_REWARD_POSITION] &&
        rewards?.[BONUS_REWARD_POSITION] > 0 &&
        !!maxBonusSpots &&
        maxBonusSpots > 0 && (
          <FormHelperText
            display={'flex'}
            w="full"
            pt={2}
            color="brand.slate.500"
          >
            <Text pr={1} fontWeight={700}>
              {maxBonusSpots} individuals
            </Text>{' '}
            will be paid
            <Text px={1} fontWeight={700}>
              {' '}
              {formatTotalPrice(rewards?.[BONUS_REWARD_POSITION]!)}{' '}
              {selectedToken?.tokenSymbol}{' '}
            </Text>
            each (total bonus of{' '}
            <Text pl={1} fontWeight={700}>
              {formatTotalPrice(
                caculateBonus(maxBonusSpots, rewards?.[BONUS_REWARD_POSITION]),
              )}{' '}
              {selectedToken?.tokenSymbol}
            </Text>
            )
          </FormHelperText>
        )}
    </FormControl>
  );
}

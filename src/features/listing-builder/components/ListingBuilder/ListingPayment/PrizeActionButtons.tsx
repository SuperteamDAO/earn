import { AddIcon } from '@chakra-ui/icons';
import { Button, HStack, type StackProps } from '@chakra-ui/react';
import { type SetStateAction } from 'react';

import { BONUS_REWARD_POSITION, MAX_PODIUMS } from '@/constants';
import { getRankLabels } from '@/utils/rank';

import { type PrizeListInterface } from './types';

type Props = StackProps & {
  prizes: PrizeListInterface[];
  BONUS_REWARD_LABEL: string;
  handlePrizeValueChange: (prizeName: number, value: number) => void;
  setPrizes: (value: SetStateAction<PrizeListInterface[]>) => void;
  handleBonusChange: (value: number | undefined) => void;
};
export function PrizeActionButtons({
  prizes,
  BONUS_REWARD_LABEL,
  handlePrizeValueChange,
  setPrizes,
  handleBonusChange,
  ...props
}: Props) {
  return (
    <HStack {...props}>
      <Button
        w="full"
        py={6}
        color="brand.slate.700"
        fontWeight={500}
        borderColor="brand.slate.700"
        borderRadius="sm"
        isDisabled={
          prizes.filter((p) => p.value !== BONUS_REWARD_POSITION).length ===
            MAX_PODIUMS && true
        }
        leftIcon={<AddIcon />}
        onClick={() => {
          const filteredPrize = prizes.filter(
            (p) => p.value !== BONUS_REWARD_POSITION,
          );
          const newPrize = [
            ...filteredPrize,
            {
              value: filteredPrize.length + 1 || 1,
              label: `${getRankLabels(filteredPrize.length + 1)} prize`,
              placeHolder: (MAX_PODIUMS - filteredPrize.length) * 500,
              defaultValue: NaN,
            },
            ...prizes.filter((p) => p.value === BONUS_REWARD_POSITION),
          ];
          handlePrizeValueChange(filteredPrize.length + 1 || 1, NaN);
          setPrizes(newPrize);
        }}
        variant="outline"
      >
        Add Individual Prize
      </Button>
      {!prizes.find((p) => p.value === BONUS_REWARD_POSITION) && (
        <Button
          w="full"
          py={6}
          color="brand.slate.500"
          fontWeight={500}
          bg="brand.slate.100"
          borderRadius="sm"
          isDisabled={
            prizes.find((p) => p.value === BONUS_REWARD_POSITION) && true
          }
          leftIcon={<AddIcon />}
          onClick={() => {
            const newPrize = [
              ...prizes,
              {
                value: BONUS_REWARD_POSITION,
                label: BONUS_REWARD_LABEL,
                placeHolder: 10,
              },
            ];
            setPrizes(newPrize);
            handlePrizeValueChange(BONUS_REWARD_POSITION, NaN);
            handleBonusChange(1);
          }}
        >
          Add Bonus Prize
        </Button>
      )}
    </HStack>
  );
}

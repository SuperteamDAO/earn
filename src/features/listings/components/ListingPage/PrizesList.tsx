import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  Step,
  StepIndicator,
  Stepper,
  StepSeparator,
  StepStatus,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { BONUS_REWARD_POSITION } from '@/constants';
import { nthLabelGenerator } from '@/utils/rank';

import { type Rewards } from '../../types';

const formatPrize = (total: number) =>
  new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(total as number);

function calculateRewards(
  iterableRewards: [string, number][],
  totalReward: number,
) {
  const firstFive = iterableRewards.slice(0, 5);
  const sumFirstFive = firstFive.reduce((sum, [_, value]) => sum + value, 0);
  const remainingReward = totalReward - sumFirstFive;

  return {
    visibleRewards: firstFive,
    remainingReward: Math.max(remainingReward, 0),
  };
}

export function PrizesList({
  rewards,
  token,
  maxBonusSpots,
  totalReward,
}: {
  rewards: Rewards;
  token: string;
  maxBonusSpots: number;
  totalReward: number;
}) {
  const iterableRewards: [string, number][] = Object.entries(rewards);
  const [visibleRewards, setVisibleRewards] =
    useState<[string, number][]>(iterableRewards);
  const [seeAll, setSeeAll] = useState(true);
  useEffect(() => {
    if (seeAll) {
      setVisibleRewards(iterableRewards);
    } else if (iterableRewards.length > 6) {
      const rippedRewards = calculateRewards(iterableRewards, totalReward);
      setVisibleRewards([
        ...rippedRewards.visibleRewards,
        [BONUS_REWARD_POSITION + '', rippedRewards.remainingReward],
      ]);
    }
  }, [seeAll]);
  useEffect(() => {
    setSeeAll(iterableRewards.length <= 6);
  }, []);
  return (
    <>
      <Stepper
        gap="0"
        w="full"
        h={`${visibleRewards.length * 40}px`}
        index={-1}
        orientation="vertical"
      >
        {visibleRewards.map((step, index) => (
          <Step key={index} style={{ overflowY: 'visible' }}>
            <StepIndicator
              sx={{
                '[data-status=incomplete] &': {
                  background: 'brand.slate.200',
                },
              }}
              pos="relative"
              top={2}
              w={3}
              h={3}
              mx={2.5}
            >
              <StepStatus />
            </StepIndicator>

            <Flex flexShrink="0" gap={2} fontSize={{ base: 'lg', md: 'xl' }}>
              <Text
                gap={1}
                display="flex"
                w="8.5rem"
                ml="auto"
                fontWeight={600}
              >
                <Text ml="auto">
                  {!seeAll && visibleRewards.length - 1 === index && '+'}{' '}
                  {formatPrize(step[1])}
                </Text>
                <Text color="brand.slate.400" fontWeight={600}>
                  {token}
                </Text>
              </Text>
              <LabelOrAction
                setSeeAll={setSeeAll}
                step={step}
                maxBonusSpots={maxBonusSpots}
                seeAll={seeAll}
                index={index}
                needsCollapse={
                  iterableRewards.length > 6 &&
                  visibleRewards.length - 1 === index
                }
              />
            </Flex>

            <StepSeparator
              style={{
                height: '100%',
                top: '1.15rem',
                maxHeight: 'none',
                borderLeft: '1px solid',
                background: 'none',
                borderColor: 'var(--chakra-colors-brand-slate-300)',
                borderStyle:
                  visibleRewards.length - 2 === index ? 'dashed' : 'solid',
              }}
            />
          </Step>
        ))}
      </Stepper>
    </>
  );
}

interface LabelOrActionProps {
  step: [string, number];
  maxBonusSpots: number;
  seeAll: boolean;
  index: number;
  setSeeAll: (val: boolean) => void;
  needsCollapse: boolean;
}

function LabelOrAction({
  step,
  maxBonusSpots,
  seeAll,
  index,
  setSeeAll,
  needsCollapse,
}: LabelOrActionProps) {
  if (Number(step[0]) === BONUS_REWARD_POSITION) {
    if (!seeAll) {
      return (
        <Button
          fontWeight={'inherit'}
          bg="transparent"
          onClick={() => setSeeAll(true)}
          rightIcon={
            <ChevronDownIcon
              border="1px solid"
              borderRadius="full"
              w={4}
              h={4}
              mt={'2px'}
            />
          }
          variant="link"
        >
          View More
        </Button>
      );
    } else
      return (
        <Text color="brand.slate.500" fontSize={'medium'}>
          {nthLabelGenerator(index + 1)} -{' '}
          {nthLabelGenerator(index + maxBonusSpots)}
          {needsCollapse && (
            <Button
              fontWeight={'inherit'}
              bg="transparent"
              onClick={() => setSeeAll(false)}
              variant="link"
            >
              <ChevronUpIcon
                border="1px solid"
                borderRadius="full"
                w={4}
                h={4}
                pos="relative"
                top={'2px'}
              />
            </Button>
          )}
        </Text>
      );
  } else {
    return (
      <Text color="brand.slate.500" fontSize={'medium'}>
        {nthLabelGenerator(Number(step[0]))}
        {needsCollapse && (
          <Button
            fontWeight={'inherit'}
            bg="transparent"
            onClick={() => setSeeAll(false)}
            variant="link"
          >
            <ChevronUpIcon
              border="1px solid"
              borderRadius="full"
              w={4}
              h={4}
              pos="relative"
              top={'2px'}
            />
          </Button>
        )}
      </Text>
    );
  }
}

import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  HStack,
  Icon,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import React from 'react';
import { LuGlobe } from 'react-icons/lu';

import { UserFlag } from '@/components/shared/UserFlag';
import { CombinedRegions } from '@/constants/Superteam';

import { getRegionTooltipLabel } from '../../utils';

export const RegionLabel = ({ region }: { region: string | undefined }) => {
  const displayValue = CombinedRegions.find(
    (st) => st.region === region,
  )?.displayValue;

  const regionTooltipLabel = getRegionTooltipLabel(region);
  return (
    <>
      <Tooltip
        px={4}
        py={2}
        color="brand.slate.500"
        fontFamily={'var(--font-sans)'}
        fontSize={'small'}
        bg="white"
        borderRadius={'lg'}
        label={regionTooltipLabel}
      >
        <HStack>
          {region === 'GLOBAL' ? (
            <Icon as={LuGlobe} strokeWidth={1} />
          ) : (
            <UserFlag location={region ?? ''} />
          )}
          <Text
            color={'brand.slate.500'}
            fontSize={{ base: 'xs', sm: 'sm' }}
            fontWeight={500}
            whiteSpace={'nowrap'}
            rounded={'full'}
          >
            {region === 'GLOBAL' ? 'Global' : `${displayValue} Only`}
          </Text>
        </HStack>
      </Tooltip>
      <Popover>
        <PopoverTrigger>
          <InfoOutlineIcon
            display={{ base: 'flex', sm: 'none' }}
            boxSize={'12px'}
          />
        </PopoverTrigger>
        <PopoverContent>
          <PopoverArrow />
          <PopoverCloseButton color="brand.slate.300" />
          <PopoverBody
            color={'brand.slate.500'}
            fontSize={'xs'}
            fontWeight={500}
          >
            {regionTooltipLabel}
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </>
  );
};

import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
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

import { Superteams } from '@/constants/Superteam';

import { getRegionTooltipLabel } from '../../utils';

export const RegionLabel = ({ region }: { region: string | undefined }) => {
  const displayValue = Superteams.find(
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
        <Text
          px={3}
          py={1}
          color={'#0800A5'}
          fontSize={{ base: 'xx-small', sm: 'xs' }}
          fontWeight={500}
          bg="#EBEAFF"
          whiteSpace={'nowrap'}
          rounded={'full'}
        >
          {region === 'GLOBAL' ? 'Global' : `${displayValue} Only`}
        </Text>
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

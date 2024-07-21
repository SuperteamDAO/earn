import { ChevronDownIcon } from '@chakra-ui/icons';
import { Box, Select } from '@chakra-ui/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect } from 'react';

import { type TIMEFRAME } from '../utils';

interface TimeRangeOption {
  value: TIMEFRAME;
  label: string;
}

interface TimeRangeDropdownProps {
  value: string;
}

export const TimeRangeDropdown: React.FC<TimeRangeDropdownProps> = ({
  value,
}) => {
  const options: TimeRangeOption[] = [
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'yearToDate', label: 'Year to Date' },
    { value: 'allTime', label: 'All Time' },
  ];

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const createQueryString = useCallback(
    (value: TIMEFRAME) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('span', value);

      return params.toString();
    },
    [searchParams],
  );

  useEffect(() => {}, [value]);

  return (
    <Box pos="relative" w="200px">
      <Select
        h="3rem"
        color="gray.500"
        fontWeight="medium"
        bg="white"
        borderColor="gray.300"
        _hover={{ borderColor: 'gray.300' }}
        _focus={{ borderColor: 'blue.500', boxShadow: 'outline' }}
        icon={<ChevronDownIcon />}
        onChange={(e) => {
          router.push(
            pathname + '?' + createQueryString(e.target.value as TIMEFRAME),
          );
        }}
        size="md"
        value={value}
        variant="outline"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </Box>
  );
};

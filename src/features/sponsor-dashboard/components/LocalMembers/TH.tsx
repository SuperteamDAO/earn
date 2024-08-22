import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Flex, Th } from '@chakra-ui/react';
import React, { type ReactNode } from 'react';

type SortDirection = 'asc' | 'desc' | null;

export const TH = ({ children }: { children: ReactNode }) => {
  return (
    <Th
      color="brand.slate.500"
      fontSize={'xs'}
      fontWeight={500}
      letterSpacing={0.5}
      textTransform={'none'}
    >
      {children}
    </Th>
  );
};

export const SortableTH = ({
  children,
  column,
  currentSort,
  setSort,
}: {
  children: ReactNode;
  column: string;
  currentSort: { column: string; direction: SortDirection };
  setSort: (column: string, direction: SortDirection) => void;
}) => {
  return (
    <TH>
      <Flex align={'center'} gap={0.5}>
        {children}
        <Flex direction={'column'}>
          <ChevronUpIcon
            color={
              currentSort.column === column && currentSort.direction === 'asc'
                ? 'brand.slate.600'
                : 'brand.slate.400'
            }
            _hover={{ color: 'brand.slate.500' }}
            cursor={'pointer'}
            mb={-1}
            onClick={() => setSort(column, 'asc')}
          />
          <ChevronDownIcon
            color={
              currentSort.column === column && currentSort.direction === 'desc'
                ? 'brand.slate.700'
                : 'brand.slate.400'
            }
            cursor={'pointer'}
            _hover={{ color: 'brand.slate.500' }}
            onClick={() => setSort(column, 'desc')}
          />
        </Flex>
      </Flex>
    </TH>
  );
};

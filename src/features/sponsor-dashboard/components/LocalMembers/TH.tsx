import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Flex, type TableColumnHeaderProps, Th } from '@chakra-ui/react';
import React, { type ReactNode } from 'react';

type SortDirection = 'asc' | 'desc' | null;

interface THProps extends TableColumnHeaderProps {
  children: ReactNode;
}

export const TH = ({ children, ...props }: THProps) => {
  return (
    <Th
      color="brand.slate.500"
      fontSize={'xs'}
      fontWeight={500}
      letterSpacing={0.5}
      textTransform={'none'}
      {...props}
    >
      {children}
    </Th>
  );
};

interface SortableTHProps extends THProps {
  column: string;
  currentSort: { column: string; direction: SortDirection };
  setSort: (column: string, direction: SortDirection) => void;
  justify?: 'left' | 'right' | 'center';
}

export const SortableTH = ({
  children,
  column,
  currentSort,
  setSort,
  justify = 'left',
  ...props
}: SortableTHProps) => {
  const handleSort = () => {
    if (currentSort.column !== column) {
      setSort(column, 'asc');
    } else {
      setSort(column, currentSort.direction === 'asc' ? 'desc' : 'asc');
    }
  };

  return (
    <TH {...props}>
      <Flex
        align={'center'}
        justify={justify}
        gap={0.5}
        cursor="pointer"
        onClick={handleSort}
      >
        <span>{children}</span>
        <Flex direction={'column'}>
          <ChevronUpIcon
            color={
              currentSort.column === column && currentSort.direction === 'asc'
                ? 'brand.slate.600'
                : 'brand.slate.400'
            }
            _hover={{ color: 'brand.slate.500' }}
            mb={-1}
          />
          <ChevronDownIcon
            color={
              currentSort.column === column && currentSort.direction === 'desc'
                ? 'brand.slate.700'
                : 'brand.slate.400'
            }
            _hover={{ color: 'brand.slate.500' }}
          />
        </Flex>
      </Flex>
    </TH>
  );
};

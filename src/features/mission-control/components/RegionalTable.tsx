import {
  Box,
  Flex,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import React from 'react';

import { EarnAvatar } from '@/components/shared/EarnAvatar';

import { type RegionData } from '../utils';

interface RegionalPaymentTableProps {
  data: RegionData[];
}

export const RegionalTable: React.FC<RegionalPaymentTableProps> = ({
  data,
}) => {
  return (
    <Box
      overflow="hidden"
      w="full"
      bg="white"
      borderWidth="1px"
      borderRadius="lg"
    >
      <Table variant="simple">
        <Thead bg="gray.50">
          <Tr color="gray.500">
            <Th pr={1} color="inherit" fontWeight={500} textTransform="none">
              No
            </Th>
            <Th color="inherit" fontWeight={500} textTransform="none">
              Region
            </Th>
            <Th color="inherit" fontWeight={500} textTransform="none" isNumeric>
              $ paid
            </Th>
            <Th color="inherit" fontWeight={500} textTransform="none" isNumeric>
              % accepted
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((region, k) => (
            <Tr key={region.name} fontSize="sm">
              <Td pr={1} color="gray.500">
                {k + 1}.
              </Td>
              <Td>
                <Flex align="center" mr={'auto'}>
                  <EarnAvatar
                    id={region.name}
                    avatar={region.icon}
                    borderRadius="4"
                    size="20px"
                  />
                  <Text ml={2} color="gray.600">
                    {region.name}
                  </Text>
                </Flex>
              </Td>
              <Td color="gray.600" fontWeight={600} isNumeric>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(region.paid)}
              </Td>
              <Td color="gray.600" fontWeight={600} isNumeric>
                {region.acceptedPercentage.toFixed(2)}%
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

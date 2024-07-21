import {
  Box,
  Flex,
  Icon,
  Image,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import React from 'react';

import { tokenList } from '@/constants';
import { TsxTypeIcon } from '@/features/mission-control';

import { type PaymentData } from '../../utils';
import { ActionButton } from './ActionButton';
import { DetailsDrawer } from './DetailsDrawer';
import ImagePopup from './ImagePopup';
import { StatusBadge } from './StatusBadge';

interface PaymentTableProps {
  data: PaymentData[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  data,
  onApprove,
  onReject,
}) => {
  return (
    <Box overflowX="auto" borderWidth={1} rounded="lg">
      <Table variant="simple">
        <Thead>
          <Tr color="brand.slate.500" fontWeight={500} bg="#F8FAFC">
            <Th color="#94A3B8" fontWeight={500} textTransform={'none'}>
              Name
            </Th>
            <Th
              color="#94A3B8"
              fontWeight={500}
              textAlign="center"
              textTransform={'none'}
            >
              Type
            </Th>
            <Th
              color="#94A3B8"
              fontWeight={500}
              textAlign="center"
              textTransform={'none'}
            >
              Date
            </Th>
            <Th
              color="#94A3B8"
              fontWeight={500}
              textAlign="center"
              textTransform={'none'}
            >
              Amount
            </Th>
            <Th color="#94A3B8" fontWeight={500} textTransform={'none'}>
              KYC
            </Th>
            <Th color="#94A3B8" fontWeight={500} textTransform={'none'}>
              Status
            </Th>
            <Th color="#94A3B8" fontWeight={500} textTransform={'none'}>
              Actions
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((payment) => {
            const tokenInfo = tokenList.find(
              (token) => token.tokenSymbol === payment.tokenSymbol,
            );
            return (
              <Tr key={payment.id}>
                <Td>
                  <DetailsDrawer {...payment} content="afe">
                    <Flex align="center" gap={2}>
                      <Icon
                        as={TsxTypeIcon}
                        color="gray.600"
                        type={payment.type}
                      />
                      <Text
                        maxW="14rem"
                        color="brand.slate.700"
                        fontWeight={500}
                        textOverflow={'ellipsis'}
                        noOfLines={1}
                      >
                        {payment.title}
                      </Text>
                      <Text color="gray.600">{payment.name}</Text>
                    </Flex>
                  </DetailsDrawer>
                </Td>
                <Td color="#334155" fontWeight={600} textAlign="center">
                  {payment.type}
                </Td>
                <Td
                  w="8.5rem"
                  color="brand.slate.500"
                  fontWeight={500}
                  textAlign="center"
                >
                  {dayjs(payment.date).format('DD MMM YY')}
                </Td>
                <Td>
                  <Flex align="center">
                    {tokenInfo && (
                      <Image
                        w="20px"
                        h="20px"
                        mr={2}
                        alt={tokenInfo.tokenName}
                        rounded="full"
                        src={tokenInfo.icon}
                      />
                    )}
                    <Text fontWeight={600}>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(payment.amount)}
                    </Text>
                    <Text ml={2} color="#94A3B8" fontWeight={600}>
                      {payment.tokenSymbol}
                    </Text>
                  </Flex>
                </Td>
                <Td>
                  <ImagePopup imageUrl={payment.kycLink} />
                </Td>
                <Td>
                  <StatusBadge status={payment.status} />
                </Td>
                <Td>
                  <Flex gap={2}>
                    {payment.status === 'pending' && (
                      <>
                        <ActionButton
                          action="approve"
                          onConfirm={() => onApprove(payment.id)}
                          size="small"
                        />
                        <ActionButton
                          action="reject"
                          onConfirm={() => onReject(payment.id)}
                          size="small"
                        />
                      </>
                    )}
                    {payment.status === 'rejected' && (
                      <ActionButton
                        action="approve"
                        onConfirm={() => onApprove(payment.id)}
                        size="small"
                      />
                    )}
                  </Flex>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
};

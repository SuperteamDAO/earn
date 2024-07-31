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
  VStack,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import React from 'react';

import { tokenList } from '@/constants';
import { TsxTypeIcon } from '@/features/mission-control';

import {
  getLabelForTsxType,
  type PaymentData,
  type TSXTYPE,
} from '../../utils';
import { ActionButton } from './ActionButton';
import { DetailsDrawer } from './DetailsDrawer';
import ImagePopup from './ImagePopup';
import { StatusBadge } from './StatusBadge';

interface PaymentTableProps {
  data: PaymentData[];
  onApprove: (id: string, approvedAmount?: number) => void;
  onReject: (id: string) => void;
  loading: boolean;
  type: TSXTYPE;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  data,
  onApprove,
  onReject,
  loading,
  type,
}) => {
  return (
    <Box
      overflowX="auto"
      w="full"
      opacity={loading ? 0.3 : 1}
      borderWidth={1}
      pointerEvents={loading ? 'none' : 'auto'}
      rounded="lg"
    >
      <Table variant="simple">
        <Thead>
          <Tr color="brand.slate.500" fontWeight={500} bg="#F8FAFC">
            <Th color="#94A3B8" fontWeight={500} textTransform={'none'}>
              Particulars
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
            {type !== 'grants' && (
              <Th
                color="#94A3B8"
                fontWeight={500}
                textAlign="center"
                textTransform={'none'}
              >
                KYC
              </Th>
            )}
            <Th
              color="#94A3B8"
              fontWeight={500}
              textAlign="center"
              textTransform={'none'}
            >
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
              <Tr key={payment.id} fontSize="sm">
                <Td>
                  <DetailsDrawer
                    {...payment}
                    onApprove={(approvedAmount?: number) =>
                      onApprove(payment.id, approvedAmount)
                    }
                    onReject={() => onReject(payment.id)}
                  >
                    <Flex align="center" gap={2}>
                      {payment.type && (
                        <Icon
                          as={TsxTypeIcon}
                          color="gray.600"
                          type={payment.type}
                        />
                      )}
                      <Text
                        maxW="15rem"
                        color="brand.slate.700"
                        fontSize={'medium'}
                        fontWeight={500}
                        textOverflow={'ellipsis'}
                        noOfLines={2}
                      >
                        {payment.title}
                      </Text>
                      <Text
                        maxW="7rem"
                        color="gray.600"
                        textOverflow={'ellipsis'}
                        noOfLines={2}
                      >
                        {payment.name}
                      </Text>
                    </Flex>
                  </DetailsDrawer>
                </Td>
                <Td color="#334155" fontWeight={600} textAlign="center">
                  {getLabelForTsxType(
                    (payment.type?.toLowerCase() as TSXTYPE) ?? 'all',
                  )}
                </Td>
                <Td
                  w="8.5rem"
                  color="brand.slate.500"
                  fontWeight={500}
                  textAlign="center"
                >
                  {payment.date && dayjs(payment.date).format('DD MMM YY')}
                </Td>
                <Td>
                  <Flex align="center" justify="center">
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
                      {payment.amount &&
                        new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(payment.amount)}
                    </Text>
                    {/* <Text ml={2} color="#94A3B8" fontWeight={600}> */}
                    {/*   {payment.tokenSymbol} */}
                    {/* </Text> */}
                  </Flex>
                </Td>
                {type !== 'grants' && (
                  <Td>
                    <VStack>
                      {payment.kycLink && (
                        <ImagePopup imageUrl={payment.kycLink} />
                      )}
                    </VStack>
                  </Td>
                )}
                <Td>
                  <VStack>
                    {payment.status && (
                      <StatusBadge mx="auto" status={payment.status} />
                    )}
                  </VStack>
                </Td>
                <Td>
                  <Flex gap={2}>
                    {payment.status === 'undecided' && (
                      <>
                        <ActionButton
                          tsxType={payment.type ?? 'all'}
                          action="approve"
                          onConfirm={(approvedAmount?: number) =>
                            onApprove(payment.id, approvedAmount)
                          }
                          size="small"
                          personName={payment.name ?? ''}
                          request={payment.amount ?? 0}
                        />
                        <ActionButton
                          tsxType={payment.type ?? 'all'}
                          request={payment.amount ?? 0}
                          personName={payment.name ?? ''}
                          action="reject"
                          onConfirm={() => onReject(payment.id)}
                          size="small"
                        />
                      </>
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

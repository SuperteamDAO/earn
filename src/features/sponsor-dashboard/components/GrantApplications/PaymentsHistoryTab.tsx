import { ChevronUpIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Box,
  Flex,
  Image,
  LinkBox,
  LinkOverlay,
  Progress,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';

import { tokenList } from '@/constants';
import { type Grant } from '@/features/grants';
import { EarnAvatar } from '@/features/talent';
import { useUser } from '@/store/user';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { approvedGranteesQuery } from '../../queries';
import { type GrantApplicationWithUser } from '../../types';
import { RecordPaymentButton } from './RecordPaymentButton';

interface GrantPaymentDetailProps {
  tranche: number;
  amount: number;
  txId?: string;
}

const extractTxId = (url: string) => {
  const match = url.match(/tx\/([a-zA-Z0-9]+)/);
  return match ? match[1] : url;
};

const PaymentDetailsRow = ({
  paymentDetails,
  token,
}: {
  paymentDetails: GrantPaymentDetailProps[];
  token: string;
}) => {
  return (
    <>
      <Td>
        {paymentDetails.map((payment, index) => (
          <Flex key={index} align="center" justify="space-between" my={2}>
            <Flex align="center" gap={1}>
              <Image
                w={4}
                h={4}
                alt={`${token}`}
                rounded={'full'}
                src={tokenList.find((t) => t.tokenSymbol === token)?.icon || ''}
              />
              <Text color="brand.slate.700" fontSize={'sm'} fontWeight={500}>
                {payment.amount}{' '}
                <Text as="span" color="brand.slate.400">
                  {token}
                </Text>
              </Text>
            </Flex>
          </Flex>
        ))}
      </Td>
      <Td>
        {paymentDetails.map((payment, index) => (
          <Flex key={index} align="center" justify="space-between" my={2}>
            <Text color="brand.slate.500" fontSize={'sm'} fontWeight={500}>
              Milestone {payment.tranche}
            </Text>
          </Flex>
        ))}
      </Td>
      {paymentDetails.some((payment) => payment.txId) && (
        <Td colSpan={2}>
          {paymentDetails.map(
            (payment, index) =>
              payment.txId && (
                <LinkBox key={index} my={2}>
                  <LinkOverlay
                    alignItems={'center'}
                    gap={1}
                    display={'flex'}
                    href={payment.txId}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Text
                      color="brand.slate.500"
                      fontSize={'sm'}
                      fontWeight={500}
                    >
                      {truncatePublicKey(extractTxId(payment.txId), 6)}
                    </Text>
                    <ExternalLinkIcon color="brand.slate.400" boxSize={4} />
                  </LinkOverlay>
                </LinkBox>
              ),
          )}
        </Td>
      )}
    </>
  );
};

export const PaymentsHistoryTab = ({
  grantId,
  grant,
}: {
  grantId: string | undefined;
  grant: Grant | undefined;
}) => {
  const { user } = useUser();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const isNativeAndNonST = !grant?.airtableId && grant?.isNative;

  const { data: grantees } = useQuery(
    approvedGranteesQuery(grantId, user?.currentSponsorId),
  );

  const toggleExpandRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const GrantTh = ({ children }: { children?: string }) => {
    return (
      <Th
        color="brand.slate.400"
        fontSize={13}
        fontWeight={500}
        letterSpacing={'-2%'}
        textTransform={'capitalize'}
      >
        {children}
      </Th>
    );
  };

  const handlePaymentRecorded = (
    updatedApplication: GrantApplicationWithUser,
  ) => {
    queryClient.setQueryData<GrantApplicationWithUser[]>(
      ['grantees', grantId],
      (oldData) =>
        oldData?.map((grantee) =>
          grantee.id === updatedApplication.id ? updatedApplication : grantee,
        ),
    );
  };

  return (
    <div>
      <TableContainer
        mb={8}
        borderWidth={'1px'}
        borderColor={'brand.slate.200'}
        borderRadius={8}
      >
        <Table variant="simple">
          <Thead>
            <Tr bg="brand.slate.100">
              <GrantTh>Approved Grantee</GrantTh>
              <GrantTh>Approved</GrantTh>
              <GrantTh>Paid Out</GrantTh>
              <GrantTh>% Paid</GrantTh>
              <GrantTh />
            </Tr>
          </Thead>
          <Tbody w="full">
            {grantees?.map((grantee: GrantApplicationWithUser) => {
              const paidPercentage = Number(
                ((grantee.totalPaid / grantee.approvedAmount) * 100).toFixed(2),
              );

              const isExpanded = expandedRows.has(grantee.id);
              return (
                <React.Fragment key={grantee.id}>
                  <Tr>
                    <Td>
                      <Flex align="center" gap={2}>
                        <EarnAvatar
                          id={grantee.userId}
                          avatar={grantee.user.photo!}
                          size="36px"
                        />
                        <Flex direction={'column'}>
                          <Text
                            color="brand.slate.700"
                            fontSize={'sm'}
                            fontWeight={500}
                          >
                            {grantee.user.firstName} {grantee.user.lastName}
                          </Text>
                          <Text
                            color="brand.slate.500"
                            fontSize={'13px'}
                            fontWeight={500}
                          >
                            @{grantee.user.username}
                          </Text>
                        </Flex>
                      </Flex>
                    </Td>
                    <Td>
                      <Flex align={'center'} gap={1}>
                        <Image
                          w={4}
                          h={4}
                          alt={grant?.token}
                          rounded={'full'}
                          src={
                            tokenList.find(
                              (t) => t.tokenSymbol === grant?.token,
                            )?.icon || ''
                          }
                        />
                        <Text
                          color="brand.slate.700"
                          fontSize={'sm'}
                          fontWeight={500}
                        >
                          {grantee.approvedAmount}{' '}
                          <Text as="span" color="brand.slate.400">
                            {grant?.token}
                          </Text>
                        </Text>
                      </Flex>
                    </Td>
                    <Td>
                      <Flex align={'center'} gap={1}>
                        <Image
                          w={4}
                          h={4}
                          alt={grant?.token}
                          rounded={'full'}
                          src={
                            tokenList.find(
                              (t) => t.tokenSymbol === grant?.token,
                            )?.icon || ''
                          }
                        />
                        <Text
                          color="brand.slate.700"
                          fontSize={'sm'}
                          fontWeight={500}
                        >
                          {grantee.totalPaid}{' '}
                          <Text as="span" color="brand.slate.400">
                            {grant?.token}
                          </Text>
                        </Text>
                      </Flex>
                    </Td>
                    <Td>
                      <Flex align={'center'} gap={3}>
                        <Progress
                          w="5rem"
                          h={'1.5'}
                          rounded={'full'}
                          value={paidPercentage}
                        />
                        <Text
                          color="brand.slate.500"
                          fontSize={'sm'}
                          fontWeight={500}
                        >
                          {paidPercentage}%
                        </Text>
                      </Flex>
                    </Td>
                    <Td px={0} isNumeric>
                      <Flex align="center" gap={2}>
                        {isNativeAndNonST && (
                          <RecordPaymentButton
                            applicationId={grantee.id}
                            buttonStyle={{ size: 'sm' }}
                            approvedAmount={grantee.approvedAmount}
                            totalPaid={grantee.totalPaid}
                            token={grant?.token || 'USDC '}
                            onPaymentRecorded={handlePaymentRecorded}
                          />
                        )}
                        <Box
                          as="span"
                          transform={
                            isExpanded ? 'rotate(0deg)' : 'rotate(180deg)'
                          }
                          cursor="pointer"
                          transition="transform 0.3s"
                          onClick={() => toggleExpandRow(grantee.id)}
                        >
                          <ChevronUpIcon />
                        </Box>
                      </Flex>
                    </Td>
                  </Tr>
                  {isExpanded && grantee.paymentDetails && (
                    <Tr>
                      <Td />
                      <PaymentDetailsRow
                        paymentDetails={
                          grantee.paymentDetails as unknown as GrantPaymentDetailProps[]
                        }
                        token={grant?.token || 'USDC'}
                      />
                    </Tr>
                  )}
                </React.Fragment>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </div>
  );
};

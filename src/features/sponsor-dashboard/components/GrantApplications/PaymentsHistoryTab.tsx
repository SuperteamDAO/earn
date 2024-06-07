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
import axios from 'axios';
import React, { useEffect, useState } from 'react';

import { EarnAvatar } from '@/components/shared/EarnAvatar';
import { userStore } from '@/store/user';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { type GrantApplicationWithUser } from '../../types';
import { RecordPaymentButton } from './RecordPaymentButton';

interface GrantPaymentDetailProps {
  tranche: number;
  amount: number;
  txId: string;
  note?: string;
}

const extractTxId = (url: string) => {
  const match = url.match(/tx\/([a-zA-Z0-9]+)/);
  return match ? match[1] : url;
};

const PaymentDetailsRow = ({
  paymentDetails,
}: {
  paymentDetails: GrantPaymentDetailProps[];
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
                alt={'USDC'}
                rounded={'full'}
                src={
                  'https://s2.coinmarketcap.com/static/img/coins/128x128/3408.png'
                }
              />
              <Text color="brand.slate.700" fontSize={'sm'} fontWeight={500}>
                {payment.amount}{' '}
                <Text as="span" color="brand.slate.400">
                  USDC
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
      <Td colSpan={2}>
        {paymentDetails.map((payment, index) => (
          <LinkBox key={index} my={2}>
            <LinkOverlay
              alignItems={'center'}
              gap={1}
              display={'flex'}
              href={payment.txId}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Text color="brand.slate.500" fontSize={'sm'} fontWeight={500}>
                {truncatePublicKey(extractTxId(payment.txId), 6)}
              </Text>
              <ExternalLinkIcon color="brand.slate.400" boxSize={4} />
            </LinkOverlay>
          </LinkBox>
        ))}
      </Td>
    </>
  );
};

export const PaymentsHistoryTab = ({
  grantId,
}: {
  grantId: string | undefined;
}) => {
  const { userInfo } = userStore();
  const [grantees, setGrantees] = useState<GrantApplicationWithUser[]>();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const getGrantees = async () => {
    try {
      const allGrantees = await axios.get(
        '/api/grantApplication/approvedGrantees',
        {
          params: {
            grantId,
          },
        },
      );
      setGrantees(allGrantees.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (userInfo?.currentSponsorId) {
      getGrantees();
    }
  }, [userInfo?.currentSponsorId]);

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

  return (
    <Box>
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
                          alt={'USDC'}
                          rounded={'full'}
                          src={
                            'https://s2.coinmarketcap.com/static/img/coins/128x128/3408.png'
                          }
                        />
                        <Text
                          color="brand.slate.700"
                          fontSize={'sm'}
                          fontWeight={500}
                        >
                          {grantee.approvedAmount}{' '}
                          <Text as="span" color="brand.slate.400">
                            USDC
                          </Text>
                        </Text>
                      </Flex>
                    </Td>
                    <Td>
                      <Flex align={'center'} gap={1}>
                        <Image
                          w={4}
                          h={4}
                          alt={'USDC'}
                          rounded={'full'}
                          src={
                            'https://s2.coinmarketcap.com/static/img/coins/128x128/3408.png'
                          }
                        />
                        <Text
                          color="brand.slate.700"
                          fontSize={'sm'}
                          fontWeight={500}
                        >
                          {grantee.totalPaid}{' '}
                          <Text as="span" color="brand.slate.400">
                            USDC
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
                        <RecordPaymentButton
                          applicationId="1"
                          buttonStyle={{ size: 'sm' }}
                        />

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
                      />
                    </Tr>
                  )}
                </React.Fragment>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

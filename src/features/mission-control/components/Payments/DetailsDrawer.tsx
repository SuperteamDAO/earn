import { CopyIcon } from '@chakra-ui/icons';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  Icon,
  Image,
  Text,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import React, { type ReactNode } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { LuMail, LuWallet } from 'react-icons/lu';

import { tokenList } from '@/constants';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { type PaymentData } from '../../utils';
import { TsxTypeIcon } from '../TsxTypeIcon';
import { ActionButton } from './ActionButton';
import { StatusBadge } from './StatusBadge';

interface SideSheetProps extends PaymentData {
  children: ReactNode;
  onApprove: (approvedAmount?: number) => void;
  onReject: () => void;
}
export const DetailsDrawer: React.FC<SideSheetProps> = ({
  children,
  title,
  name,
  type,
  status,
  amount,
  tokenSymbol,
  email,
  walletAddress,
  discordId,
  onApprove,
  onReject,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const tokenInfo = tokenList.find(
    (token) => token.tokenSymbol === tokenSymbol,
  );

  return (
    <>
      <div onClick={onOpen}>{children}</div>
      <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="xl">
        <DrawerOverlay />
        <DrawerContent>
          {/* <DrawerCloseButton /> */}
          <DrawerHeader
            px={8}
            py={10}
            fontSize="lg"
            fontWeight={600}
            borderBottomWidth="1px"
          >
            <Flex justify="space-between">
              <Flex gap={4}>
                <Icon
                  as={TsxTypeIcon}
                  w={14}
                  h={14}
                  p={4}
                  color="#64748B"
                  bg={'#F8FAFC'}
                  rounded="lg"
                  type={type ?? 'all'}
                />
                <Flex direction="column">
                  <Text>{title}</Text>
                  <Text color="brand.slate.400">by {name}</Text>
                </Flex>
              </Flex>
              <Flex align="center" gap={4}>
                <StatusBadge h="fit-content" status={status ?? 'all'} />
                {status === 'undecided' && (
                  <>
                    <ActionButton
                      tsxType={type ?? 'all'}
                      action="approve"
                      onConfirm={onApprove}
                      size="small"
                      personName={name ?? ''}
                      request={amount ?? 0}
                    />
                    <ActionButton
                      tsxType={type ?? 'all'}
                      action="reject"
                      onConfirm={onReject}
                      size="small"
                      personName={name ?? ''}
                      request={amount ?? 0}
                    />
                  </>
                )}
              </Flex>
            </Flex>
          </DrawerHeader>

          <DrawerBody>
            <HStack gap={6} color="#94A3B8">
              <HStack>
                <Text fontSize="sm" fontWeight={600}>
                  ASK
                </Text>
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
                  <Text color="#1E293B" fontWeight={600}>
                    {amount &&
                      new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(amount)}
                  </Text>
                  <Text ml={2} color="#94A3B8" fontWeight={600}>
                    {tokenSymbol}
                  </Text>
                </Flex>
              </HStack>
              <HStack ml="auto">
                <LuMail />
                <Text fontWeight={500}>{email}</Text>
              </HStack>
              <HStack>
                <LuWallet />
                <Text color="brand.slate.400">
                  {walletAddress && truncatePublicKey(walletAddress, 3)}
                  <Tooltip label="Copy Wallet ID" placement="right">
                    <CopyIcon
                      cursor="pointer"
                      ml={1}
                      color="brand.slate.400"
                      onClick={() =>
                        navigator.clipboard.writeText(walletAddress || '')
                      }
                    />
                  </Tooltip>
                </Text>
              </HStack>
              <HStack>
                <FaDiscord />
                <Text fontWeight={500}>{discordId}</Text>
              </HStack>
            </HStack>
            {/* {content} */}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

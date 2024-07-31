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
  Link,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import React, { type ReactNode } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { LuMail, LuWallet } from 'react-icons/lu';

import { tokenList } from '@/constants';
import {
  ActionButton,
  type PaymentData,
  StatusBadge,
  TsxTypeIcon,
} from '@/features/mission-control';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

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
  shortTitle,
  region,
  summary,
  description,
  kpi,
  category,
  approver,
  deadline,
  telegram,
  milestones,
  proofOfWork,
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
                  bg="#F8FAFC"
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
              <HStack ml="auto" />
              {email && (
                <HStack ml="auto">
                  <LuMail />
                  <Text fontWeight={500}>{email}</Text>
                </HStack>
              )}
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
              {discordId && (
                <HStack>
                  <FaDiscord />
                  <Text fontWeight={500}>{discordId}</Text>
                </HStack>
              )}
            </HStack>
            <VStack align="start" gap={6} pt={8} fontSize="sm">
              {type === 'grants' && (
                <>
                  <LabeledContent label="Project Title" content={shortTitle} />
                  <LabeledContent
                    label="One-liner description"
                    content={summary}
                  />
                  <LabeledContent
                    label="Project Details"
                    content={description}
                  />
                  <LabeledContent
                    label="Deadline"
                    content={dayjs(deadline).format('DD MMM YYYY')}
                  />
                  <LabeledContent label="Proof of Work" content={proofOfWork} />
                  <LabeledContent label="Milestones" content={milestones} />
                  <LabeledContent
                    label="Primary Key Performance Indicator"
                    content={kpi}
                  />
                </>
              )}
              {type === 'miscellaneous' && (
                <>
                  <LabeledContent label="Proof of Work" content={proofOfWork} />
                  <LabeledContent label="Category" content={category} />
                  <LabeledContent label="Approver" content={approver} />
                  <LabeledContent label="Region" content={region} />
                </>
              )}
              {type === 'st-earn' && (
                <>
                  <LabeledContent label="Email ID" content={email} />
                  <LabeledContent label="Telegram" content={telegram} />
                  <LabeledContent label="Category" content={category} />
                  <LabeledContent label="Proof of Work" content={proofOfWork} />
                  <LabeledContent label="Region" content={region} />
                </>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

const LabeledContent = ({
  label,
  content,
  isLink = false,
}: {
  label: string;
  content?: string | null;
  isLink?: boolean;
}) => {
  return (
    <VStack align="start">
      <Text color="brand.slate.400" textTransform="uppercase">
        {label}
      </Text>
      {isLink ? (
        <Link color="brand.slate.700" href={content ? content : '#'} isExternal>
          {content ?? '-'}
        </Link>
      ) : (
        <Text color="brand.slate.700">{content ?? '-'}</Text>
      )}
    </VStack>
  );
};

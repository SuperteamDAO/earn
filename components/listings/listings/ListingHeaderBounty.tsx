/* eslint-disable no-nested-ternary */
import {
  Box,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Link,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import type { BountyType } from '@prisma/client';
import { useRouter } from 'next/router';
import React from 'react';
import { TbBellRinging } from 'react-icons/tb';

import { EarningModal } from '@/components/modals/earningModal';
import type { SponsorType } from '@/interface/sponsor';
import type { User } from '@/interface/user';
import { dayjs } from '@/utils/dayjs';

interface Bounty {
  id: string | undefined;
  title: string;
  deadline?: string;
  status?: 'OPEN' | 'REVIEW' | 'CLOSED';
  isActive?: boolean;
  isPublished?: string;
  isFeatured?: string;
  sponsor?: SponsorType | undefined;
  poc?: User;
  slug?: string;
  type?: BountyType | string;
  isWinnersAnnounced?: boolean;
}

function ListingHeader({
  title,
  status,
  deadline,
  sponsor,
  poc,
  type,
  slug,
  isWinnersAnnounced,
}: Bounty) {
  const router = useRouter();
  const sub: any[] = [];
  const { isOpen, onClose, onOpen } = useDisclosure();

  const hasDeadlineEnded = dayjs().isAfter(deadline);

  return (
    <VStack bg={'white'}>
      {isOpen && <EarningModal isOpen={isOpen} onClose={onClose} />}
      <VStack
        align="start"
        justify={['start', 'start', 'space-between', 'space-between']}
        flexDir={['column', 'column', 'row', 'row']}
        gap={5}
        w={'full'}
        maxW={'7xl'}
        mx={'auto'}
        py={10}
      >
        <HStack align="start" px={[3, 3, 0, 0]}>
          <Image
            w={'4rem'}
            h={'4rem'}
            objectFit={'cover'}
            alt={'phantom'}
            rounded={'md'}
            src={
              sponsor?.logo ||
              `${router.basePath}/assets/images/sponsor-logo.png`
            }
          />
          <VStack align={'start'}>
            <Heading
              color={'brand.charcoal.700'}
              fontFamily={'Inter'}
              fontSize={'lg'}
              fontWeight={700}
            >
              {title}
            </Heading>
            <HStack>
              <Text color={'#94A3B8'}>
                by {poc?.firstName} at {sponsor?.name}
              </Text>
              {(status === 'CLOSED' ||
                (status === 'OPEN' && isWinnersAnnounced)) && (
                <Text
                  px={3}
                  py={1}
                  color={'orange.600'}
                  fontSize={'sm'}
                  bg={'orange.100'}
                  rounded={'full'}
                >
                  Closed
                </Text>
              )}
              {hasDeadlineEnded && status === 'OPEN' && (
                <Text
                  px={3}
                  py={1}
                  color={'orange.600'}
                  fontSize={'sm'}
                  bg={'orange.100'}
                  rounded={'full'}
                >
                  In Review
                </Text>
              )}
              {!hasDeadlineEnded && status === 'OPEN' && (
                <Text
                  px={3}
                  py={1}
                  color={'green.600'}
                  fontSize={'sm'}
                  bg={'green.100'}
                  rounded={'full'}
                >
                  Open
                </Text>
              )}
            </HStack>
          </VStack>
        </HStack>
        {router.asPath.includes('bounties') && (
          <HStack>
            <HStack align="start" px={[3, 3, 0, 0]}>
              <IconButton
                aria-label="Notify"
                icon={<TbBellRinging />}
                onClick={() => onOpen()}
                variant="solid"
              />
            </HStack>
            <HStack>
              <HStack
                pos={'relative'}
                align={'center'}
                justify={'center'}
                display={sub?.length! === 0 ? 'none' : 'flex'}
                w={'3rem'}
              >
                {sub?.slice(0, 3).map((e, index) => {
                  return (
                    <Box
                      key={e.id}
                      pos={'absolute'}
                      left={index}
                      marginInlineStart={1}
                    >
                      <Image
                        w={8}
                        h={8}
                        objectFit={'contain'}
                        alt={e.Talent?.username}
                        rounded={'full'}
                        src={e.Talent?.avatar}
                      />
                    </Box>
                  );
                })}
              </HStack>
              <VStack align={'start'}>
                <Text color={'#000000'} fontSize={'md'} fontWeight={500}>
                  {sub?.length ?? 0}
                </Text>
                <Text
                  mt={'0px !important'}
                  color={'gray.500'}
                  fontSize={'md'}
                  fontWeight={500}
                >
                  People Interested
                </Text>
              </VStack>
            </HStack>
          </HStack>
        )}
      </VStack>
      {router.asPath.includes('bounties') && (
        <Flex
          align={'center'}
          w={'full'}
          h={10}
          borderTop={'1px solid'}
          borderTopColor={'gray.100'}
        >
          <HStack
            align="center"
            justifyContent="start"
            gap={10}
            w={'full'}
            maxW={'7xl'}
            h={'full'}
            mx={'auto'}
            my={'auto'}
            px={3}
          >
            <Link
              alignItems="center"
              justifyContent="center"
              display="flex"
              h={'full'}
              color="gray.800"
              fontWeight={500}
              textDecoration="none"
              borderBottom="2px solid"
              borderBottomColor={
                !router.asPath.includes('submission')
                  ? 'brand.purple'
                  : 'transparent'
              }
              _hover={{
                textDecoration: 'none',
                borderBottom: '2px solid',
                borderBottomColor: 'brand.purple',
              }}
              href={`/listings/bounties/${slug}`}
            >
              Details
            </Link>
            {type !== 'permissioned' && (
              <Link
                alignItems="center"
                justifyContent="center"
                display="flex"
                h={'full'}
                color="gray.800"
                fontWeight={500}
                textDecoration="none"
                borderBottom="2px solid"
                borderBottomColor={
                  router.asPath.includes('submission')
                    ? 'brand.purple'
                    : 'transparent'
                }
                _hover={{
                  textDecoration: 'none',
                  borderBottom: '2px solid',
                  borderBottomColor: 'brand.purple',
                }}
                href={`/listings/bounties/${slug}/submission`}
              >
                Submissions
              </Link>
            )}
          </HStack>
        </Flex>
      )}
    </VStack>
  );
}

export default ListingHeader;

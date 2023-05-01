/* eslint-disable no-nested-ternary */
import {
  Box,
  Heading,
  HStack,
  IconButton,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';
import moment from 'moment';
import { useRouter } from 'next/router';
import React from 'react';
import { TbBellRinging } from 'react-icons/tb';

import type { Eligibility } from '@/interface/bounty';
import type { SponsorType } from '@/interface/sponsor';
import type { User } from '@/interface/user';

interface Bounty {
  id: string | undefined;
  title: string;
  deadline?: string;
  eligibility?: Eligibility;
  status?: 'OPEN' | 'REVIEW' | 'CLOSED';
  isActive?: boolean;
  isPublished?: string;
  isFeatured?: string;
  sponsor?: SponsorType | undefined;
  poc?: User;
}

function ListingHeader({ title, status, deadline, sponsor, poc }: Bounty) {
  const router = useRouter();
  const sub: any[] = [];

  const hasDeadlineEnded =
    parseInt(moment(deadline).format('x'), 10) < Date.now();

  return (
    <VStack bg={'white'}>
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
              {status === 'CLOSED' && (
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
              {(status === 'REVIEW' ||
                (hasDeadlineEnded && status === 'OPEN')) && (
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
    </VStack>
  );
}

export default ListingHeader;

import {
  Box,
  Circle,
  Flex,
  Image,
  Link,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Text,
} from '@chakra-ui/react';
import { franc } from 'franc';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { tokenList } from '@/constants';
import { dayjs } from '@/utils/dayjs';

import type { Bounty } from '../types';
import { CompensationAmount } from './ListingPage/CompensationAmount';

export const ListingCardSkeleton = () => {
  return (
    <Box px={{ base: 1, sm: 4 }} py={4} borderRadius={5}>
      <Flex align={'center'} justify={'space-between'} w="100%">
        <Flex w="100%" h={{ base: 14, sm: 16 }}>
          <Skeleton
            w={{ base: '4.2rem', sm: '4.6rem' }}
            h={{ base: 14, sm: 16 }}
            mr={{ base: 3, sm: 5 }}
            rounded={5}
          />
          <Flex justify={'space-between'} direction={'column'} w={'full'}>
            <Skeleton w="60%" h="3.5" />
            <Skeleton
              w="130px"
              h="3"
              fontSize={{ md: 'sm', base: 'xs' }}
              noOfLines={1}
            />
            <Flex gap={2}>
              <SkeletonText
                w="56px"
                fontSize={{ md: 'sm', base: 'xs' }}
                noOfLines={1}
              />
              <Skeleton
                w="48px"
                fontSize={{ md: 'sm', base: 'xs' }}
                noOfLines={1}
              />
            </Flex>
          </Flex>
        </Flex>
        <Flex align={'center'} gap={2}>
          <SkeletonCircle size={'4'} />
          <Skeleton w="54px" h="14px" noOfLines={1} />
        </Flex>
      </Flex>
    </Box>
  );
};

export const ListingCard = ({
  bounty,
  checkLanguage,
  adjustMobile,
}: {
  bounty: Bounty;
  checkLanguage?: boolean;
  adjustMobile?: boolean;
}) => {
  const {
    rewardAmount,
    deadline,
    type,
    sponsor,
    title,
    token,
    slug,
    applicationType,
    isWinnersAnnounced,
    description,
    compensationType,
    minRewardAsk,
    maxRewardAsk,
  } = bounty;
  const router = useRouter();

  const isBounty = type === 'bounty';

  const langCode = franc(description);

  const isEnglish = description
    ? langCode === 'eng' || langCode === 'sco'
    : true;

  if (!isEnglish && checkLanguage) {
    return null;
  }

  return (
    <>
      <Link
        as={NextLink}
        w="full"
        px={{ base: 2, sm: 4 }}
        py={4}
        borderRadius={5}
        _hover={{
          textDecoration: 'none',
          bg: 'gray.100',
        }}
        href={`/listings/${type}/${slug}`}
      >
        <Flex
          align="center"
          justify="space-between"
          w={{ base: '100%', md: 'brand.120' }}
        >
          <Flex w="100%">
            <Image
              w={{ base: 14, sm: 16 }}
              h={{ base: 14, sm: 16 }}
              mr={{ base: 3, sm: 5 }}
              alt={sponsor?.name}
              rounded={5}
              src={
                sponsor?.logo
                  ? sponsor.logo.replace(
                      '/upload/',
                      '/upload/c_scale,w_128,h_128,f_auto/',
                    )
                  : `${router.basePath}/assets/logo/sponsor-logo.png`
              }
            />
            <Flex justify={'space-between'} direction={'column'} w={'full'}>
              <Text
                color="brand.slate.700"
                fontSize={['sm', 'sm', 'md', 'md']}
                fontWeight={600}
                _hover={{
                  textDecoration: 'underline',
                }}
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {title}
              </Text>
              <Text
                w={'full'}
                color={'brand.slate.500'}
                fontSize={{ md: 'sm', base: 'xs' }}
              >
                {sponsor?.name}
              </Text>
              <Flex align={'center'} gap={{ base: 1, sm: 3 }} mt={'1px'}>
                <>
                  <Flex
                    align={'center'}
                    justify="start"
                    display={{ base: 'flex', sm: 'none' }}
                  >
                    {compensationType !== 'variable' && (
                      <Image
                        w={3.5}
                        h={3.5}
                        mr={0.5}
                        alt={token}
                        rounded="full"
                        src={
                          tokenList.find((ele) => {
                            return ele.tokenSymbol === token;
                          })?.icon
                        }
                      />
                    )}
                    <Flex align="baseline">
                      <Text
                        color={'brand.slate.600'}
                        fontSize={'xs'}
                        fontWeight={'600'}
                        whiteSpace={'nowrap'}
                      >
                        <CompensationAmount
                          compensationType={compensationType}
                          maxRewardAsk={maxRewardAsk}
                          minRewardAsk={minRewardAsk}
                          rewardAmount={rewardAmount}
                        />
                      </Text>
                      {compensationType !== 'variable' && (
                        <Text
                          color={'gray.400'}
                          fontSize={'xs'}
                          fontWeight={500}
                        >
                          {token}
                        </Text>
                      )}
                    </Flex>
                    <Text
                      ml={1}
                      color={'brand.slate.300'}
                      fontSize={'xx-small'}
                    >
                      |
                    </Text>
                  </Flex>
                  <Image
                    display={
                      adjustMobile ? { base: 'none', sm: 'flex' } : 'flex'
                    }
                    h={{ base: 3, sm: 4 }}
                    ml={isBounty ? -0.5 : 0}
                    alt={type}
                    src={
                      isBounty
                        ? '/assets/icons/bolt.svg'
                        : '/assets/icons/briefcase.svg'
                    }
                  />
                  <Text
                    display={
                      adjustMobile ? { base: 'none', sm: 'flex' } : 'flex'
                    }
                    ml={{ base: -1, sm: isBounty ? '-3' : '-2.5' }}
                    color="gray.500"
                    fontSize={['x-small', 'xs', 'xs', 'xs']}
                    fontWeight={500}
                  >
                    {type && type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </>
                <Text
                  display={adjustMobile ? { base: 'none', sm: 'flex' } : 'flex'}
                  color={'brand.slate.300'}
                  fontSize={['xx-small', 'xs', 'sm', 'sm']}
                >
                  |
                </Text>

                <Flex align={'center'} gap={1}>
                  <Text
                    color={'gray.500'}
                    fontSize={['x-small', 'xs', 'xs', 'xs']}
                    whiteSpace={'nowrap'}
                  >
                    {dayjs().isBefore(dayjs(deadline))
                      ? applicationType === 'rolling'
                        ? 'Rolling Deadline'
                        : `Due ${dayjs(deadline).fromNow()}`
                      : `Closed ${dayjs(deadline).fromNow()}`}
                  </Text>
                  {dayjs().isBefore(dayjs(deadline)) && !isWinnersAnnounced && (
                    <Circle bg="#16A35F" size="8px" />
                  )}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
          <Flex
            align={'center'}
            justify="start"
            display={{ base: 'none', sm: 'flex' }}
            mr={compensationType !== 'variable' ? 3 : 0}
          >
            {compensationType !== 'variable' && (
              <Image
                w={4}
                h={4}
                mt={[1, 1, 0.5, 0.5]}
                mr={1}
                alt={token}
                rounded="full"
                src={
                  tokenList.find((ele) => {
                    return ele.tokenSymbol === token;
                  })?.icon
                }
              />
            )}
            <Flex align="baseline" gap={1}>
              <Text
                color={'brand.slate.600'}
                fontSize={['xs', 'xs', 'md', 'md']}
                fontWeight={'600'}
                whiteSpace={'nowrap'}
              >
                <CompensationAmount
                  compensationType={compensationType}
                  maxRewardAsk={maxRewardAsk}
                  minRewardAsk={minRewardAsk}
                  rewardAmount={rewardAmount}
                />
              </Text>
              {compensationType !== 'variable' && (
                <Text
                  color={'gray.400'}
                  fontSize={['xs', 'xs', 'md', 'md']}
                  fontWeight={500}
                >
                  {token}
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Link>
    </>
  );
};

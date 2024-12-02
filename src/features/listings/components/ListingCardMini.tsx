import { Box, Flex, Image, Text } from '@chakra-ui/react';
import dayjs from 'dayjs';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { tokenList } from '@/constants/tokenList';

import { type Listing } from '../types';
import { getListingIcon } from '../utils';
import { CompensationAmount } from './ListingPage/CompensationAmount';

export const ListingCardMini = ({ bounty }: { bounty: Listing }) => {
  const {
    rewardAmount,
    deadline,
    type,
    sponsor,
    title,
    token,
    slug,
    compensationType,
    minRewardAsk,
    maxRewardAsk,
  } = bounty;
  const router = useRouter();

  const isBounty = type === 'bounty';

  return (
    <>
      <Box
        className="ph-no-capture"
        as={NextLink}
        w="full"
        px={2}
        py={4}
        borderRadius={5}
        _hover={{
          textDecoration: 'none',
          bg: 'gray.100',
        }}
        href={`/listings/${type}/${slug}`}
      >
        <Flex
          className="ph-no-capture"
          align="center"
          justify="space-between"
          w={'100%'}
        >
          <Flex w="100%">
            <Image
              w={14}
              h={14}
              mr={3}
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
                className="ph-no-capture"
                color="brand.slate.700"
                fontSize={'sm'}
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
              <Flex align={'center'} gap={1} w="min-content">
                <Text
                  w="full"
                  color="brand.slate.500"
                  fontSize={{ base: 'xs' }}
                  whiteSpace={'nowrap'}
                >
                  {sponsor?.name}
                </Text>
                <div>{!!sponsor?.isVerified && <VerifiedBadge />}</div>
              </Flex>
              <Flex align={'center'} wrap={'wrap'} gap={1} mt={'1px'}>
                <>
                  <Flex align={'center'} justify="start" display={'flex'}>
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
                      <CompensationAmount
                        compensationType={compensationType}
                        maxRewardAsk={maxRewardAsk}
                        minRewardAsk={minRewardAsk}
                        rewardAmount={rewardAmount}
                        className="whitespace-nowrap text-xs font-semibold text-slate-600"
                      />
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
                      fontSize={['xx-small', 'xs', 'sm', 'sm']}
                    >
                      |
                    </Text>
                  </Flex>
                  <Image
                    display={'flex'}
                    h={3}
                    ml={isBounty ? -0.5 : 0}
                    alt={type}
                    src={getListingIcon(type!)}
                  />
                </>
                <Text
                  display={'flex'}
                  color={'brand.slate.300'}
                  fontSize={['xx-small', 'xs', 'sm', 'sm']}
                >
                  |
                </Text>

                <Flex align={'center'} gap={1}>
                  <Text
                    color={'gray.500'}
                    fontSize={'x-small'}
                    whiteSpace={'nowrap'}
                  >
                    {dayjs().isBefore(dayjs(deadline))
                      ? `Due ${dayjs(deadline).fromNow()}`
                      : `Closed ${dayjs(deadline).fromNow()}`}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </>
  );
};

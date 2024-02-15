import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Avatar,
  Box,
  Button,
  Flex,
  Image,
  LinkBox,
  LinkOverlay,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { AiFillHeart } from 'react-icons/ai';
import { BiComment } from 'react-icons/bi';

import { tokenList } from '@/constants';
import { PrizeListMap } from '@/interface/listings';
import type { SubmissionWithUser } from '@/interface/submission';
import type { User } from '@/interface/user';
import { userStore } from '@/store/user';
import { timeAgoShort } from '@/utils/timeAgo';
import { getURL } from '@/utils/validUrl';

import { OgImageViewer } from '../misc/ogImageViewer';

export function SubmissionCard({
  talent,
  sub,
}: {
  talent: User;
  sub: SubmissionWithUser;
}) {
  const { userInfo } = userStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(
    !!sub?.like?.find((e: any) => e.id === userInfo?.id),
  );
  const [totalLikes, setTotalLikes] = useState<number>(sub?.like?.length ?? 0);

  const handleLike = async () => {
    try {
      setIsLoading(true);
      await axios.post('/api/submission/like', {
        submissionId: sub?.id,
      });
      if (isLiked) {
        setIsLiked(false);
        setTotalLikes((prevLikes) => Math.max(prevLikes - 1, 0));
      } else {
        setIsLiked(true);
        setTotalLikes((prevLikes) => prevLikes + 1);
        await axios.post(`/api/email/manual/submissionLike`, {
          id: sub?.id,
        });
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log(error);
    }
  };

  useEffect(() => {
    setIsLiked(!!sub?.like?.find((e: any) => e.id === userInfo?.id));
  }, [sub.like, userInfo?.id]);

  const breakpoint = useBreakpointValue({ base: 'base', md: 'md' });

  const isBounty = sub?.listing?.type === 'bounty';

  const listingLink = `${getURL()}listings/${sub?.listing?.type}/${
    sub?.listing?.slug
  }`;

  const submissionLink = `${listingLink}/submission/${sub?.id}`;

  return (
    <Box my={'16'}>
      <Flex align="center" justify={'space-between'}>
        <Flex align="center">
          <Avatar
            name={`${talent?.firstName}${talent?.lastName}`}
            size={'xs'}
            src={talent?.photo as string}
          />
          <Text
            color={'brand.slate.400'}
            fontSize={{ base: 'xs', md: 'md' }}
            fontWeight={500}
          >
            <Text as={'span'} ml={2} color={'brand.slate.900'} fontWeight={600}>
              {talent?.firstName} {talent?.lastName}
            </Text>{' '}
            {sub?.isWinner && sub?.listing?.isWinnersAnnounced ? (
              <Text as={'span'}>
                {isBounty ? 'won a bounty' : 'got selected for a project'}
              </Text>
            ) : (
              <Text as={'span'}>
                {isBounty ? 'submitted to a bounty' : 'applied to a project'}
              </Text>
            )}
          </Text>
        </Flex>
        <Text
          color={'brand.slate.400'}
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight={500}
        >
          {timeAgoShort(sub?.createdAt)} {breakpoint === 'md' && ' ago'}
        </Text>
      </Flex>
      <Box
        mt={4}
        borderWidth={'1px'}
        borderColor={'brand.slate.200'}
        borderRadius={'6'}
        shadow={'0px 4px 4px 0px rgba(0, 0, 0, 0.01)'}
      >
        {sub?.isWinner && sub?.listing?.isWinnersAnnounced ? (
          <Flex
            justify={'center'}
            direction={'column'}
            w="full"
            h={{ base: '200px', md: '350px' }}
            bg={'#7E51FF'}
            borderTopRadius={6}
          >
            <Image
              w={{ base: '36px', md: '80px' }}
              h={{ base: '36px', md: '80px' }}
              mx={'auto'}
              alt="winner"
              src={'/assets/icons/celebration.png'}
            />
            <Flex
              align="center"
              justify={'center'}
              gap={{ base: '1', md: '4' }}
              w="100%"
              mt={4}
            >
              <Image
                w={{ base: '8', md: '16' }}
                h={{ base: '8', md: '16' }}
                alt={`${sub?.listing?.token} icon`}
                src={
                  tokenList.find(
                    (token) => token.tokenSymbol === sub?.listing?.token,
                  )?.icon || ''
                }
              />
              <Text
                color="white"
                fontSize={{ base: '2xl', md: '5xl' }}
                fontWeight={600}
              >
                {sub?.winnerPosition
                  ? `$${sub?.listing?.rewards?.[sub?.winnerPosition]}`
                  : 'N/A'}{' '}
                {sub?.listing?.token}
              </Text>
            </Flex>
            <Text
              w="fit-content"
              mx="auto"
              my={4}
              px={4}
              py={2}
              color="white"
              fontSize={{ base: 'xs', md: 'lg' }}
              fontWeight={500}
              bg={'rgba(85, 54, 171, 0.54)'}
              borderRadius={'full'}
            >
              {PrizeListMap[
                sub?.winnerPosition as keyof typeof PrizeListMap
              ].toUpperCase()}
            </Text>
          </Flex>
        ) : (
          <OgImageViewer
            externalUrl={sub?.link ?? ''}
            w="full"
            h={{ base: '200px', md: '350px' }}
            objectFit="cover"
            borderTopRadius={6}
          />
        )}
        <Flex
          align={'center'}
          justify={'space-between'}
          px={{ base: '3', md: '6' }}
          py={{ base: '4', md: '6' }}
        >
          <Flex align={'center'} gap={3}>
            <Avatar size={'xs'} src={sub?.listing?.sponsor?.logo} />
            <Text
              color={'brand.slate.500'}
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight={600}
            >
              {sub?.listing?.title}
            </Text>
          </Flex>
          <LinkBox
            alignItems={'center'}
            gap={2}
            display="flex"
            whiteSpace={'nowrap'}
          >
            <LinkOverlay href={isBounty ? submissionLink : listingLink}>
              <Text
                as="span"
                color={'#6366F1'}
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight={600}
              >
                {isBounty ? 'View Submission' : 'View Listing'}
              </Text>
            </LinkOverlay>
            <ArrowForwardIcon color={'#6366F1'} />
          </LinkBox>
        </Flex>
      </Box>
      <Flex align={'center'}>
        <Button
          zIndex={10}
          alignItems={'center'}
          gap={1}
          display={'flex'}
          w={14}
          isLoading={isLoading}
          onClick={(e) => {
            e.stopPropagation();
            if (!userInfo?.id) return;
            handleLike();
          }}
          variant={'unstyled'}
        >
          <AiFillHeart color={!isLiked ? '#94A3B8' : '#FF005C'} />
          {totalLikes}
        </Button>
        <BiComment
          color={'#94A3B8'}
          style={{
            transform: 'scaleX(-1)',
            marginTop: '2px',
            cursor: 'pointer',
          }}
          onClick={() => {
            window.location.href = isBounty ? submissionLink : listingLink;
          }}
        />
      </Flex>
    </Box>
  );
}

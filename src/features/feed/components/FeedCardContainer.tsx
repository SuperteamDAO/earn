import {
  Box,
  Flex,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import axios from 'axios';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { type ReactNode, useEffect, useState } from 'react';
import { GoComment } from 'react-icons/go';
import { IoMdHeart, IoMdHeartEmpty } from 'react-icons/io';

import { EarnAvatar } from '@/components/shared/EarnAvatar';
import { AuthWrapper } from '@/features/auth';
import { userStore } from '@/store/user';
import { getURLSanitized } from '@/utils/getURLSanitized';

import { FeedCardHeader } from './FeedCardHeader';

interface FeedCardContainerProps {
  content: {
    actionText: string;
    createdAt: string;
    description?: string;
  };
  actionLinks: ReactNode;
  children: ReactNode;
  type: 'activity' | 'profile';
  firstName: string;
  lastName: string;
  photo: string | undefined;
  username?: string;
  id: string;
  like: any;
  commentLink?: string;
  cardType: 'submission' | 'pow';
  link: string;
  userId: string;
}

export const FeedCardContainer = ({
  content,
  actionLinks,
  children,
  type,
  firstName,
  lastName,
  photo,
  username,
  id,
  like,
  commentLink,
  cardType,
  link,
  userId,
}: FeedCardContainerProps) => {
  const { userInfo } = userStore();

  const [isLiked, setIsLiked] = useState<boolean>(
    !!like?.find((e: any) => e.id === userInfo?.id),
  );
  const [totalLikes, setTotalLikes] = useState<number>(like?.length ?? 0);

  const sanitizedLink = getURLSanitized(link);

  useEffect(() => {
    setIsLiked(!!like?.find((e: any) => e.id === userInfo?.id));
  }, [like, userInfo?.id]);

  const handleLike = async () => {
    const newIsLiked = !isLiked;
    const newTotalLikes = newIsLiked
      ? totalLikes + 1
      : Math.max(totalLikes - 1, 0);

    setIsLiked(newIsLiked);
    setTotalLikes(newTotalLikes);

    try {
      await axios.post(`/api/${cardType}/like`, { id });
    } catch (error) {
      console.log(error);
      setIsLiked(isLiked);
      setTotalLikes(totalLikes);
      alert('Failed to update like status. Please try again.');
    }
  };

  const router = useRouter();
  const isSM = useBreakpointValue({ base: false, md: true });

  return (
    <Box
      mx="0"
      mt={'-1px'}
      px={type === 'activity' ? 5 : 0}
      py={{ base: 4, md: 8 }}
      borderColor={'brand.slate.200'}
      borderBottomWidth={type === 'activity' ? '1px' : '0px'}
    >
      <Flex gap={3}>
        <EarnAvatar
          id={userId}
          avatar={photo}
          size={isSM ? '44px' : '32px'}
          onClick={() => router.push(`/t/${username}`)}
        />
        <Flex direction={'column'} w={'full'}>
          <FeedCardHeader
            name={`${firstName} ${lastName}`}
            photo={photo}
            username={username}
            action={content.actionText}
            createdAt={content.createdAt}
            description={content.description}
            type={type}
          />
          <Box
            as={NextLink}
            mt={4}
            borderWidth={'1px'}
            borderColor={'brand.slate.200'}
            borderRadius={'6'}
            shadow={'0px 4px 4px 0px rgba(0, 0, 0, 0.01);'}
            _hover={{
              shadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.1)',
              transform: 'translateY(-0.5px)',
              transition: 'all 0.1s ease-in-out',
            }}
            cursor={'pointer'}
            href={sanitizedLink}
            rel="noopener noreferrer"
            target="_blank"
          >
            {children}
            <Flex
              align={{ base: 'start', md: 'center' }}
              justify={'space-between'}
              direction={{ base: 'column', md: 'row' }}
              px={{ base: '3', md: '6' }}
              py={{ base: '4', md: '6' }}
            >
              {actionLinks}
            </Flex>
          </Box>
          {id && (
            <Flex align={'center'} mt={2} pointerEvents={id ? 'all' : 'none'}>
              <Box
                zIndex={10}
                alignItems={'center'}
                gap={1}
                display={'flex'}
                mr={2}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!userInfo?.id) return;
                  handleLike();
                }}
              >
                {!isLiked && (
                  <AuthWrapper>
                    <IoMdHeartEmpty
                      size={isSM ? '22px' : '20px'}
                      color={'#64748b'}
                      cursor={'pointer'}
                    />
                  </AuthWrapper>
                )}
                {isLiked && (
                  <IoMdHeart
                    size={isSM ? '22px' : '20px'}
                    color={'#E11D48'}
                    cursor={'pointer'}
                  />
                )}
                <Text color="brand.slate.500" fontSize={'md'} fontWeight={500}>
                  {totalLikes}
                </Text>
              </Box>
              {commentLink && (
                <GoComment
                  color={'#64748b'}
                  size={isSM ? '21px' : '19px'}
                  style={{
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    window.location.href = commentLink;
                  }}
                />
              )}
            </Flex>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export const FeedCardContainerSkeleton = () => {
  return (
    <Box
      mx="0"
      mt={'-1px'}
      px={5}
      py={8}
      borderColor={'brand.slate.200'}
      borderBottomWidth={'1px'}
    >
      <Flex gap={3}>
        <SkeletonCircle w="44px" h="44px" />
        <Flex direction={'column'} w={'full'}>
          <Box>
            <SkeletonText w={36} h={5} mt={1} noOfLines={2} spacing="2" />
          </Box>
          <Skeleton
            h={{ base: '200px', md: '300px' }}
            mt={4}
            p={4}
            borderWidth={'1px'}
            borderColor={'brand.slate.200'}
            borderRadius={'6'}
            shadow={'0px 4px 4px 0px rgba(0, 0, 0, 0.01)'}
          />
        </Flex>
      </Flex>
    </Box>
  );
};

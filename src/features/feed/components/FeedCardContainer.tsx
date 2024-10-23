import {
  Avatar,
  AvatarGroup,
  Box,
  Collapse,
  Flex,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Text,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { type ReactNode, useEffect, useState } from 'react';
import { GoComment } from 'react-icons/go';
import { IoMdHeart, IoMdHeartEmpty } from 'react-icons/io';

import { AuthWrapper } from '@/features/auth';
import { Comments } from '@/features/comments';
import { EarnAvatar } from '@/features/talent';
import { useUser } from '@/store/user';
import { getURLSanitized } from '@/utils/getURLSanitized';

import { type FeedDataProps } from '../types';
import { convertFeedPostTypeToCommentRefType } from '../utils';
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
  commentCount?: number;
  cardType: 'submission' | 'pow' | 'grant-application';
  link: string;
  userId: string;
  recentCommenters?: FeedDataProps['recentCommenters'];
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
  commentCount: initialCommentCount,
  cardType,
  link,
  userId,
  recentCommenters: initialRecentCommenters,
}: FeedCardContainerProps) => {
  const { user } = useUser();

  const [isLiked, setIsLiked] = useState<boolean>(
    !!like?.find((e: any) => e.id === user?.id),
  );
  const [totalLikes, setTotalLikes] = useState<number>(like?.length ?? 0);
  const {
    onToggle: onToggleComment,
    isOpen: isCommentOpen,
    onClose: onCloseComment,
  } = useDisclosure();
  const [commentCount, setCommentCount] = useState(initialCommentCount || 0);
  const [recentCommenters, setRecentCommenters] = useState(
    initialRecentCommenters,
  );

  const handleCommentSuccess = () => {
    setCommentCount((prevCount) => (prevCount || 0) + 1);

    setRecentCommenters((prevCommenters) => [
      ...(prevCommenters ? prevCommenters.slice(0, 3) : []),
      { author: { photo: user?.photo || null, name: user?.firstName || null } },
    ]);
    onCloseComment();
  };

  const sanitizedLink = getURLSanitized(link);

  useEffect(() => {
    setIsLiked(!!like?.find((e: any) => e.id === user?.id));
  }, [like, user?.id]);

  const handleLike = async () => {
    const newIsLiked = !isLiked;
    if (newIsLiked) posthog.capture('liked post_feed');
    else posthog.capture('unliked post_feed');
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
  const posthog = usePostHog();
  const isSM = useBreakpointValue({ base: false, md: true });

  return (
    <Box
      mx="0"
      mt={'-1px'}
      px={type === 'activity' ? 5 : 0}
      py={{ base: 4, md: 8 }}
      borderColor={'brand.slate.200'}
      borderBottomWidth={type === 'activity' ? '1px' : '0px'}
      // cursor={
      //   id && router.asPath !== `/feed/${cardType}/${id}/` ? 'pointer' : 'auto'
      // }
      // onClick={(e) => {
      //   const target = e.target as HTMLElement;
      //   const nonTargetElement =
      //     target.closest('#comment-form') || target.closest('#feed-actions');
      //
      //   if (nonTargetElement) {
      //     e.stopPropagation();
      //     e.nativeEvent.stopImmediatePropagation();
      //     return;
      //   }
      //   if (id && router.asPath !== `/feed/${cardType}/${id}/`)
      //     router.push(`/feed/${cardType}/${id}`);
      // }}
    >
      <Flex gap={3}>
        <EarnAvatar
          id={userId}
          avatar={photo}
          size={isSM ? '44px' : '32px'}
          onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            router.push(`/t/${username}`);
          }}
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
            <Flex
              align={'center'}
              gap={8}
              w="fit-content"
              mt={2}
              py={2}
              pr={8}
              pointerEvents={id ? 'all' : 'none'}
              cursor="default"
              id="feed-actions"
            >
              <Box
                className="ph-no-capture"
                zIndex={10}
                alignItems={'center'}
                gap={1}
                display={'flex'}
                mr={2}
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  if (!user?.id) return;
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
              <Box
                className="ph-no-capture"
                zIndex={10}
                alignItems={'center'}
                gap={1}
                display={'flex'}
                mr={2}
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  onToggleComment();
                }}
              >
                <GoComment
                  color={'#64748b'}
                  size={isSM ? '21px' : '19px'}
                  style={{
                    cursor: 'pointer',
                  }}
                />
                {!!commentCount && (
                  <Text
                    color="brand.slate.500"
                    fontSize={'md'}
                    fontWeight={500}
                  >
                    {commentCount}
                  </Text>
                )}
                <AvatarGroup ml={4} max={4} size={'xs'}>
                  {recentCommenters?.map((comment, index) => (
                    <Avatar
                      key={index}
                      pos="relative"
                      name={comment.author.name || ''}
                      src={comment.author.photo || ''}
                    />
                  ))}
                </AvatarGroup>
              </Box>
            </Flex>
          )}
          <Collapse
            animateOpacity
            in={isCommentOpen}
            style={{ width: '100%', overflow: 'visible!important' }}
          >
            <Box
              mt={6}
              id="comment-form"
              onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
            >
              {/* <CommentForm */}
              {/*   refId={id} */}
              {/*   refType={convertFeedPostTypeToCommentRefType(cardType)} */}
              {/*   defaultSuggestions={new Map()} */}
              {/*   onSuccess={handleCommentSuccess} */}
              {/* /> */}
              <Comments
                isAnnounced={false}
                listingSlug={''}
                listingType={''}
                poc={undefined}
                sponsorId={undefined}
                isVerified={false}
                refId={id}
                refType={convertFeedPostTypeToCommentRefType(cardType)}
                count={commentCount}
                setCount={setCommentCount}
                onSuccess={handleCommentSuccess}
                take={3}
              />
            </Box>
          </Collapse>
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

import { Avatar, Button, Flex, Text, Tooltip } from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { GoComment } from 'react-icons/go';
import { IoMdHeart, IoMdHeartEmpty } from 'react-icons/io';

import { OgImageViewer } from '@/components/misc/ogImageViewer';
import { type FeedDataProps } from '@/pages/feed';
import { userStore } from '@/store/user';
import { getURL } from '@/utils/validUrl';

import { FeedCardContainer, FeedCardLink } from './FeedCardContainer';
import { WinnerFeedImage } from './WinnerFeedImage';

interface SubCardProps {
  sub: FeedDataProps;
  type: 'profile' | 'activity';
}

export function SubmissionCard({ sub, type }: SubCardProps) {
  const { userInfo } = userStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(
    !!sub?.like?.find((e: any) => e.id === userInfo?.id),
  );
  const [totalLikes, setTotalLikes] = useState<number>(sub?.like?.length ?? 0);

  const firstName = sub?.firstName;
  const lastName = sub?.lastName;
  const photo = sub?.photo;
  const username = sub?.username;

  const handleLike = async () => {
    try {
      setIsLoading(true);
      console.log(sub);
      await axios.post('/api/submission/like', {
        submissionId: sub?.id,
      });
      if (isLiked) {
        setIsLiked(false);
        setTotalLikes((prevLikes) => Math.max(prevLikes - 1, 0));
      } else {
        setIsLiked(true);
        setTotalLikes((prevLikes) => prevLikes + 1);
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

  const isProject = sub?.listingType === 'project';

  const listingLink = `${getURL()}listings/${sub?.listingType}/${sub?.listingSlug}`;

  const submissionLink = `${listingLink}/submission/${sub?.id}`;

  let winningText: string = '';
  let submissionText: string = '';

  switch (sub?.listingType) {
    case 'bounty':
      winningText = 'won a bounty';
      submissionText = 'submitted to a bounty';
      break;
    case 'hackathon':
      winningText = 'won a hackathon track';
      submissionText = 'submitted to a hackathon';
      break;
    case 'project':
      winningText = 'got selected for a project';
      submissionText = 'applied to a project';
      break;
  }

  const content = {
    actionText:
      sub?.isWinner && sub?.isWinnersAnnounced ? winningText : submissionText,
    createdAt: sub?.createdAt,
  };

  const actionLinks = (
    <>
      <Flex align={'center'} gap={3}>
        <Avatar size={'xs'} src={sub?.sponsorLogo} />
        <Text
          color={'brand.slate.500'}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={600}
        >
          {sub?.listingTitle}
        </Text>
      </Flex>
      <Tooltip
        px={4}
        py={2}
        color="brand.slate.500"
        fontFamily={'var(--font-sans)'}
        bg="white"
        borderRadius={'lg'}
        isDisabled={!!sub?.id && !isProject}
        label={
          'This submission will be accessible once winners for the listing have been announced.'
        }
        shouldWrapChildren
      >
        <FeedCardLink
          href={isProject ? listingLink : submissionLink}
          style={{
            opacity: sub?.id ? '100%' : '50%',
            pointerEvents: sub?.id ? 'all' : 'none',
          }}
        >
          {isProject ? 'View Listing' : 'View Submission'}
        </FeedCardLink>
      </Tooltip>
    </>
  );

  const likesAndComments = (
    <Flex align={'center'} pointerEvents={sub?.id ? 'all' : 'none'}>
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
        {!isLiked && <IoMdHeartEmpty size={'22px'} color={'#64748b'} />}
        {isLiked && <IoMdHeart size={'22px'} color={'#E11D48'} />}
        <Text color="brand.slate.500" fontSize={'md'} fontWeight={500}>
          {totalLikes}
        </Text>
      </Button>
      <GoComment
        color={'#64748b'}
        size={'21px'}
        style={{
          cursor: 'pointer',
        }}
        onClick={() => {
          window.location.href = isProject ? listingLink : submissionLink;
        }}
      />
    </Flex>
  );

  return (
    <FeedCardContainer
      content={content}
      actionLinks={actionLinks}
      likesAndComments={likesAndComments}
      type={type}
      firstName={firstName}
      lastName={lastName}
      photo={photo}
      username={username}
    >
      {sub?.isWinner && sub?.isWinnersAnnounced ? (
        <WinnerFeedImage
          token={sub?.token}
          rewards={sub?.rewards}
          winnerPosition={sub?.winnerPosition}
        />
      ) : (
        <OgImageViewer
          externalUrl={sub?.link ?? ''}
          w="full"
          h={{ base: '200px', md: '350px' }}
          objectFit="cover"
          borderTopRadius={6}
        />
      )}
    </FeedCardContainer>
  );
}

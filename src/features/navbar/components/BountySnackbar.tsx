import { EditIcon } from '@chakra-ui/icons';
import { HStack, Text } from '@chakra-ui/react';
import { type status } from '@prisma/client';
import { atom, useAtom } from 'jotai';
import { useRouter } from 'next/router';

import { useUser } from '@/store/user';
import { dayjs } from '@/utils/dayjs';

type BountySnackbarType = {
  isCaution: boolean | undefined;
  submissionCount: number;
  deadline: string | undefined;
  rewardAmount: number | undefined;
  type: string | undefined;
  isPublished: boolean | undefined;
  status?: status;
  sponsorId: string | undefined;
  slug: string | undefined;
};

export const bountySnackbarAtom = atom<BountySnackbarType | null>(null);

export const BountySnackbar = () => {
  const router = useRouter();
  const [bountySnackbar] = useAtom(bountySnackbarAtom);
  const user = useUser();

  const { asPath, query } = router;

  if (!!query['preview']) return null;

  const showSnackbar = asPath.split('/')[1] === 'listings';

  if (!bountySnackbar) return null;

  const {
    submissionCount,
    deadline,
    rewardAmount,
    type,
    isPublished,
    isCaution,
    status,
    sponsorId,
    slug,
  } = bountySnackbar;

  const isExpired = deadline && dayjs(deadline).isBefore(dayjs());

  const isPreviewSponsor =
    status === 'PREVIEW' && user.user?.currentSponsorId === sponsorId;

  const getBackgroundColor = () => {
    if (status === 'PREVIEW') return 'brand.slate.500';
    if (!isPublished) return '#DC4830';
    if (isExpired) return '#6A6A6A';
    if (isCaution) return '#DC4830';
    return '#B869D3';
  };

  const getSnackbarMessage = (): string | null => {
    const daysToDeadline = deadline
      ? dayjs(deadline).diff(dayjs(), 'day')
      : null;
    if (status === 'PREVIEW') {
      if (user.user?.currentSponsorId === sponsorId) {
        return 'Note: This link is for preview purposes only and is accessible only to those who have it. It is not your final link for sharing with your community';
      } else
        return 'This Listing Is In Preview Mode. Check Out Other Listings on Our Homepage!';
    }
    if (!isPublished)
      return 'This Listing Is Inactive Right Now. Check Out Other Listings on Our Homepage!';
    if (isExpired)
      return 'The Deadline for This Listing Has Passed. Check Out Other Listings on the Homepage!';
    if (isCaution)
      return 'Proceed with caution! Some users have flagged this listing as potentially misleading.';
    if (daysToDeadline && daysToDeadline < 3)
      return `🕛 Expiring Soon: ${
        type === 'bounty' ? 'Submit' : 'Apply'
      } while you still have the chance!`;
    if (
      rewardAmount &&
      ((type === 'bounty' && rewardAmount > 1000) ||
        (type === 'project' && rewardAmount > 1500))
    )
      return `🤑 Mo' Money, Fewer Problems: Higher than average total ${type} reward`;
    if (
      (type === 'bounty' && submissionCount <= 1) ||
      (type === 'project' && submissionCount < 10)
    ) {
      if (submissionCount === 0) {
        return type === 'bounty'
          ? '🔥 High chance of winning: No submissions have been made for this bounty yet!'
          : '🔥 The Odds Are in Your Favour! No applications yet';
      }
      return type === 'bounty'
        ? `🔥 High chance of winning: Only ${submissionCount} submission(s) have been made for this bounty yet!`
        : '🔥 The Odds Are in Your Favour! Not too many applications yet';
    }

    return null;
  };

  const message = getSnackbarMessage();
  const bgColor = getBackgroundColor();

  if (showSnackbar && bountySnackbar && message) {
    return (
      <HStack
        justify="center"
        gap={1}
        w="full"
        color="white"
        cursor={isPreviewSponsor ? 'pointer' : 'default'}
        bgColor={bgColor}
        onClick={() => {
          if (!isPreviewSponsor) return;
          router.push(`/dashboard/listings/${slug}/edit`);
        }}
      >
        {isPreviewSponsor && <EditIcon />}
        <Text
          p={3}
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight={500}
          textAlign="center"
        >
          {message}
        </Text>
      </HStack>
    );
  }
  return null;
};

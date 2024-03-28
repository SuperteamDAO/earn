import { Box, Text } from '@chakra-ui/react';
import dayjs from 'dayjs';
import { atom, useAtom } from 'jotai';
import { useRouter } from 'next/router';

type BountySnackbarType = {
  submissionCount: number;
  deadline: string | undefined;
  rewardAmount: number | undefined;
  type: string | undefined;
  isPublished: boolean | undefined;
};

export const bountySnackbarAtom = atom<BountySnackbarType | null>(null);

export const BountySnackbar = () => {
  const router = useRouter();
  const [bountySnackbar] = useAtom(bountySnackbarAtom);

  const { asPath } = router;

  const showSnackbar = /^\/listings\/(bounty|project)\/[^/]+\/?$/.test(asPath);

  if (!bountySnackbar) return null;

  const { submissionCount, deadline, rewardAmount, type, isPublished } =
    bountySnackbar;

  const isExpired = deadline && dayjs(deadline).isBefore(dayjs());

  const getBackgroundColor = () => {
    if (!isPublished) return '#DC4830';
    if (isExpired) return '#6A6A6A';
    return '#B869D3';
  };

  const getSnackbarMessage = (): string | null => {
    const daysToDeadline = deadline
      ? dayjs(deadline).diff(dayjs(), 'day')
      : null;

    if (!isPublished)
      return 'This Listing Is Inactive Right Now. Check Out Other Listings on Our Homepage!';
    if (isExpired)
      return 'The Deadline for This Listing Has Passed. Check Out Other Listings on the Homepage!';
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
      <Box w="full" color="white" bgColor={bgColor}>
        <Text
          p={3}
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight={500}
          textAlign="center"
        >
          {message}
        </Text>
      </Box>
    );
  }
  return null;
};

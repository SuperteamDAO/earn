import { Box, Text } from '@chakra-ui/react';
import dayjs from 'dayjs';
import { atom, useAtom } from 'jotai';
import { useRouter } from 'next/router';

type BountySnackbarType = {
  submissionCount: number;
  deadline: string | undefined;
  rewardAmount: number | undefined;
  type: string | undefined;
};

export const bountySnackbarAtom = atom<BountySnackbarType | null>(null);

export const BountySnackbar = () => {
  const router = useRouter();
  const [bountySnackbar] = useAtom(bountySnackbarAtom);

  const { pathname } = router;

  const showSnackbar = /^\/listings\/bounties\/[^/]+$/.test(pathname);

  const getMessage = () => {
    if (bountySnackbar) {
      const { submissionCount, deadline, rewardAmount, type } = bountySnackbar;

      if (deadline && dayjs(deadline).isBefore(dayjs())) {
        return null;
      }

      if (type === 'open') {
        if (deadline) {
          const daysToDeadline = dayjs(deadline).diff(dayjs(), 'day');
          if (daysToDeadline < 3) {
            return '🕛 Expiring Soon: Submit while you still have the chance!';
          }
        }

        if (rewardAmount && rewardAmount > 1000) {
          return "🤑 Mo' Money, Fewer Problems: Higher than average total bounty reward!";
        }

        if (submissionCount === 0) {
          return '🔥 High chance of winning: No submissions have been made for this bounty yet!';
        }

        if (submissionCount === 1) {
          return '🔥 High chance of winning: Only 1 submission has been made for this bounty yet!';
        }

        if (submissionCount < 10) {
          return `🔥 High chance of winning: Only ${submissionCount} submissions have been made for this bounty yet!`;
        }
      } else if (type === 'permissioned') {
        if (deadline) {
          const daysToDeadline = dayjs(deadline).diff(dayjs(), 'day');
          if (daysToDeadline < 3) {
            return '🕛 Expiring Soon: Apply while you still have the chance!';
          }
        }

        if (submissionCount < 10) {
          return '🔥 The Odds Are in Your Favour! Not too many applications yet';
        }

        if (rewardAmount && rewardAmount > 1500) {
          return "🤑 Mo' Money, Fewer Problems: Higher than average total project reward";
        }
      }
    }

    return null;
  };

  const message = getMessage();

  if (showSnackbar && bountySnackbar && message) {
    return (
      <Box w="full" color="white" bgColor="#B869D3">
        <Text p={3} fontSize="sm" fontWeight={500} textAlign="center">
          {message}
        </Text>
      </Box>
    );
  }
  return null;
};

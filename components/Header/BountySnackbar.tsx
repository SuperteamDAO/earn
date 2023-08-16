import { Box, Text } from '@chakra-ui/react';
import dayjs from 'dayjs';
import { atom, useAtom } from 'jotai';
import { useRouter } from 'next/router';

type BountySnackbarType = {
  submissionCount: number;
  deadline: string | undefined;
  rewardAmount: number | undefined;
};

export const bountySnackbarAtom = atom<BountySnackbarType | null>(null);

export const BountySnackbar = () => {
  const router = useRouter();
  const [bountySnackbar] = useAtom(bountySnackbarAtom);

  const { pathname } = router;

  const showSnackbar = /^\/listings\/bounties\/[^/]+$/.test(pathname);

  const getMessage = () => {
    if (bountySnackbar) {
      const { submissionCount, deadline, rewardAmount } = bountySnackbar;

      if (deadline && dayjs(deadline).isBefore(dayjs())) {
        return null;
      }

      if (deadline) {
        const daysToDeadline = dayjs(deadline).diff(dayjs(), 'day');
        if (daysToDeadline < 3) {
          return '🕛 Expiring Soon: Submit while you still have the chance!';
        }
      }

      if (rewardAmount && rewardAmount > 1000) {
        return "🤑 Mo' Money, Fewer Problems: Higher than average total bounty reward!";
      }

      if (submissionCount < 10) {
        return `🔥 High chance of winning: Only ${submissionCount} submissions have been made for this bounty yet!`;
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

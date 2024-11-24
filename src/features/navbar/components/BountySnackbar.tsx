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
        return '注意：此链接仅用于预览，仅供拥有该链接的人访问。这并不是你与社区分享的最终链接。';
      } else {
        return '此列表处于预览模式。在主页上查看其他任务';
      }
    }
    if (!isPublished) return `这个任务不活跃。在主页上查看其他任务`;
    if (isExpired)
      return `这个上市的截止日期已经过去了。在主页上查看其他任务`;

    if (isCaution)
      return `小心！一些用户认为这个任务可能具有误导性`

    if (daysToDeadline && daysToDeadline < 3)
      return `🕛 马上到期了:  趁你还有机会，快快${type === 'bounty' ? '提交' : '申请'}`;
    if (
      rewardAmount &&
      ((type === 'bounty' && rewardAmount > 1000) ||
        (type === 'project' && rewardAmount > 1500))
    )
      return `🤑 钱多，问题少：高于平均${type}总奖励`;

    if (
      (type === 'bounty' && submissionCount <= 1) ||
      (type === 'project' && submissionCount < 10)
    ) {
      if (submissionCount === 0) {
        return type === 'bounty'
          ? '🔥 获胜几率高：还没有人提交任务'
          : '🔥 你胜算很大！还没有人申请';
      }
      return type === 'bounty'
        ? `🔥 获胜几率高: 目前仅有 ${submissionCount}人提交了任务`
        : '🔥 你胜算很大！还没有太多人申请';
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

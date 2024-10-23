import { EditIcon } from '@chakra-ui/icons';
import { HStack, Text } from '@chakra-ui/react';
import { type status } from '@prisma/client';
import { atom, useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

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
  const { t } = useTranslation('common');

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
        return t('BountySnackbar.previewSponsorMessage');
      } else return t('BountySnackbar.previewMessage');
    }
    if (!isPublished) return t('BountySnackbar.inactiveMessage');
    if (isExpired) return t('BountySnackbar.expiredMessage');
    if (isCaution) return t('BountySnackbar.cautionMessage');
    if (daysToDeadline && daysToDeadline < 3)
      return t('BountySnackbar.expiringMessage', {
        type:
          type === 'bounty'
            ? t('BountySnackbar.submit')
            : t('BountySnackbar.apply'),
      });
    if (
      rewardAmount &&
      ((type === 'bounty' && rewardAmount > 1000) ||
        (type === 'project' && rewardAmount > 1500))
    )
      return t('BountySnackbar.highRewardMessage', { type });
    if (
      (type === 'bounty' && submissionCount <= 1) ||
      (type === 'project' && submissionCount < 10)
    ) {
      if (submissionCount === 0) {
        return type === 'bounty'
          ? t('BountySnackbar.noBountySubmissions')
          : t('BountySnackbar.noProjectApplications');
      }
      return type === 'bounty'
        ? t('BountySnackbar.fewBountySubmissions', { count: submissionCount })
        : t('BountySnackbar.fewProjectApplications');
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
        {isPreviewSponsor && (
          <EditIcon aria-label={t('BountySnackbar.editIcon')} />
        )}
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

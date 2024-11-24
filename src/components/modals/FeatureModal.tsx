import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Link,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import NextImage from 'next/image';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { latestActiveSlugQuery } from '@/features/sponsor-dashboard';
import { useUpdateUser, useUser } from '@/store/user';

export const FeatureModal = ({
  isSponsorsRoute = false,
  forceOpen = false,
}: {
  isSponsorsRoute?: boolean;
  forceOpen?: boolean;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const updateUser = useUpdateUser();
  const [isOpen, setIsOpen] = useState(false);

  const { data: latestActiveSlug } = useQuery({
    ...latestActiveSlugQuery,
    enabled:
      !!user?.currentSponsorId &&
      user.featureModalShown === false &&
      (isSponsorsRoute || !router.pathname.includes('dashboard')),
  });

  useEffect(() => {
    const shouldShowModal = async () => {
      if (
        (user?.currentSponsorId &&
          user.featureModalShown === false &&
          (isSponsorsRoute || !router.pathname.includes('dashboard')) &&
          latestActiveSlug &&
          user.currentSponsor?.isVerified) ||
        forceOpen
      ) {
        if (!searchParams.has('scout')) setIsOpen(true);
        if (!forceOpen) {
          await updateUser.mutateAsync({ featureModalShown: true });
        }
      }
    };

    shouldShowModal();
  }, [user, router.pathname, latestActiveSlug, isSponsorsRoute, forceOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const onSubmit = () => {
    handleClose();
  };

  return (
    <Modal autoFocus={false} isOpen={isOpen} onClose={handleClose} size="sm">
      <ModalOverlay />
      <ModalContent overflow="hidden" rounded="lg">
        <Box w="full" p={8} bg="#FAF5FF">
          <NextImage
            src="/assets/ScoutAnnouncement.png"
            alt="Scouts Announcement Illustration"
            width={300}
            height={300}
            style={{ width: '92%', height: '100%' }}
          />
        </Box>
        <VStack align="start" gap={3} p={6}>
          <Text fontSize="lg" fontWeight={600}>
            介绍 Scout功能
          </Text>
          <Text color="brand.slate.500">
            Solar Earn
            上最优秀人才的精选列表，您可以邀请他们参与您的任务，从而获得高质量的提交！添加新的任务，或查看您当前的任何列表来试用
            Scout。
          </Text>
          <Link
            as={latestActiveSlug ? NextLink : 'div'}
            href={
              latestActiveSlug
                ? `/dashboard/listings/${latestActiveSlug}/submissions?scout`
                : ``
            }
            onClick={onSubmit}
            style={{ width: '100%' }}
          >
            <Button gap={2} w="full" fontSize="sm" fontWeight={500}>
              {latestActiveSlug ? (
                <>
                  Check it out <ArrowForwardIcon />
                </>
              ) : (
                '了解更多!'
              )}
            </Button>
          </Link>
        </VStack>
      </ModalContent>
    </Modal>
  );
};

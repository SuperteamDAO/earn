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
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { user } = useUser();
  const updateUser = useUpdateUser();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation('common');

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
          latestActiveSlug) ||
        forceOpen
      ) {
        setIsOpen(true);
        if (!forceOpen) {
          await updateUser.mutateAsync({ featureModalShown: true });
        }
      }
    };

    shouldShowModal();
  }, [
    user,
    router.pathname,
    updateUser,
    latestActiveSlug,
    isSponsorsRoute,
    forceOpen,
  ]);

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
            {t('featureModal.title')}
          </Text>
          <Text color="brand.slate.500">{t('featureModal.description')}</Text>
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
                  {t('featureModal.checkItOut')} <ArrowForwardIcon />
                </>
              ) : (
                t('featureModal.goodToKnow')
              )}
            </Button>
          </Link>
        </VStack>
      </ModalContent>
    </Modal>
  );
};

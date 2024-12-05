import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Button,
  Link,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';
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
        <div className="w-full bg-[#faf5ff] p-8">
          <img
            src={ASSET_URL + '/ScoutAnnouncement.png'}
            alt="Scouts Announcement Illustration"
            style={{ width: '92%', height: '100%' }}
          />
        </div>
        <VStack align="start" gap={3} p={6}>
          <Text fontSize="lg" fontWeight={600}>
            Introducing Scout
          </Text>
          <Text color="brand.slate.500">
            A curated list of the best talent on Superteam Earn that you can
            invite to participate in your listings to get high quality
            submissions! Add a new listing, or check out any of your currently
            live listings to try Scout.
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
                'Good to know!'
              )}
            </Button>
          </Link>
        </VStack>
      </ModalContent>
    </Modal>
  );
};

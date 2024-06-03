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
import NextImage from 'next/image';
import NextLink from 'next/link';

export const FeatureModal = ({
  isOpen,
  onClose,
  latestActiveBountySlug,
}: {
  isOpen: boolean;
  onClose: () => void;
  latestActiveBountySlug?: string;
}) => {
  const onSubmit = () => {
    onClose();
  };

  return (
    <Modal autoFocus={false} isOpen={isOpen} onClose={onClose} size="sm">
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
            Introducing Scout
          </Text>
          <Text color="brand.slate.500">
            A curated list of the best talent on Superteam Earn that you can
            invite to participate in your listings to get high quality
            submissions! Add a new listing, or check out any of your currently
            live listings to try Scout.
          </Text>
          <Link
            as={latestActiveBountySlug ? NextLink : 'div'}
            href={
              latestActiveBountySlug
                ? `/dashboard/listings/${latestActiveBountySlug}/submissions?scout`
                : ``
            }
            onClick={onSubmit}
            style={{ width: '100%' }}
          >
            <Button gap={2} w="full" fontSize="sm" fontWeight={500}>
              {latestActiveBountySlug ? (
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

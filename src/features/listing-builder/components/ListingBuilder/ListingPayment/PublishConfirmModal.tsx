import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';

interface Props {
  isOpen: boolean;
  isPrivate: boolean;
  isListingPublishing: boolean;
  onClose: () => void;
  createAndPublishListing: () => void;
}
export function PublishConfirmModal({
  isOpen,
  isPrivate,
  isListingPublishing,
  onClose,
  createAndPublishListing,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Confirm Publishing?</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>
            {isPrivate
              ? 'This listing will only be accessible via the link — and will not show up anywhere else on the site — since it has been marked as a "Private Listing"'
              : 'Publishing this listing means it will show up on the homepage for all visitors. Make sure the details in your listing are correct before you publish.'}
          </Text>
        </ModalBody>

        <ModalFooter>
          <Button mr={4} onClick={onClose} variant="ghost">
            Close
          </Button>
          <Button
            mr={3}
            colorScheme="blue"
            disabled={isListingPublishing}
            isLoading={isListingPublishing}
            loadingText="Publishing..."
            onClick={() => createAndPublishListing()}
          >
            Publish
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

import {
  Button,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { usePostHog } from 'posthog-js/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bodyText?: string;
  isSponsor: boolean;
}

export function CompleteProfileModal({
  isOpen,
  onClose,
  bodyText,
  isSponsor,
}: Props) {
  const posthog = usePostHog();

  const header = isSponsor
    ? 'Add your talent profile'
    : 'Complete your profile';

  const body = isSponsor
    ? 'You already have a sponsor profile, but we need other details from you before proceeding with this action. Doing this will not impact your sponsor profile.'
    : bodyText;

  const CTA = isSponsor ? 'Add Talent Profile' : 'Complete Profile';

  return (
    <Modal isCentered isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(3px)" />
      <ModalContent px={6} py={3} bg="white" borderRadius="xl" shadow="xl">
        <ModalHeader px={0} pb={4} fontSize="xl" fontWeight={500}>
          {header}
        </ModalHeader>
        <ModalCloseButton top={6} right={6} />
        <ModalBody px={0} py={2}>
          <Text fontSize="md" lineHeight="tall">
            {body}
          </Text>
        </ModalBody>
        <ModalFooter px={0} pt={2}>
          <Button
            className="ph-no-capture"
            as={Link}
            fontWeight="medium"
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: 'md',
            }}
            transition="all 0.2s"
            colorScheme="blue"
            href="/new/talent"
            onClick={() => posthog.capture('complete profile_CTA pop up')}
          >
            {CTA}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

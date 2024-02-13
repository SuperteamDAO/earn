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
} from '@chakra-ui/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  bodyText?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
}

export function WarningModal({
  isOpen,
  onClose,
  title,
  bodyText,
  primaryCtaText,
  primaryCtaLink,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={'sm'}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>{bodyText}</ModalBody>
        <ModalFooter>
          <Button mr={4} onClick={onClose} variant="ghost">
            Close
          </Button>
          <Button
            as={Link}
            _hover={{ textDecoration: 'none' }}
            colorScheme="blue"
            href={primaryCtaLink}
          >
            {primaryCtaText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

import {
  AspectRatio,
  Button,
  Flex,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  bodyText?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  videoEmbed?: boolean;
}

function WarningModal({
  isOpen,
  onClose,
  title,
  bodyText,
  primaryCtaText,
  primaryCtaLink,
  videoEmbed,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={'sm'}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {videoEmbed && (
            <AspectRatio mb={4} borderRadius={3} ratio={16 / 9}>
              <iframe
                src="https://fast.wistia.net/embed/iframe/3rbdvj2tgz"
                allowTransparency={true}
                className="wistia_embed"
                name="wistia_embed"
                allowFullScreen
                width="100%"
                height="100%"
              />
            </AspectRatio>
          )}
          <Text fontSize="15px" textAlign={'center'}>
            {bodyText}
          </Text>
        </ModalBody>

        <Flex justify={'space-between'} pt={2} pb={8} px={8}>
          <Button onClick={onClose} variant="ghost">
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
        </Flex>
      </ModalContent>
    </Modal>
  );
}

export default WarningModal;

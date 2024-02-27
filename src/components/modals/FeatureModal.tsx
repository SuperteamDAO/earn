import {
  Badge,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import React from 'react';

export const FeatureModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent pt={3} pb={8}>
        <ModalHeader />
        <ModalCloseButton mt={{ base: 2, md: 3 }} />
        <ModalBody fontSize={{ base: 14, md: 16 }}>
          <Image
            py={{ base: 1, md: 2 }}
            alt="new feature"
            src="/assets/rfpannouncement.png"
          />
          <Badge
            my={2}
            px={2}
            py={0.5}
            color="blue.700"
            fontWeight={600}
            textTransform={'none'}
            colorScheme="blue"
            rounded={'full'}
          >
            New
          </Badge>
          <Text color="brand.slate.700" fontSize={'lg'} fontWeight={500}>
            Announcing Quotes for Projects
          </Text>
          <Text mt={1} color="brand.slate.500" lineHeight={5}>
            You can now send your desired rates for Projects and get paid for
            what you think is the right price.
          </Text>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

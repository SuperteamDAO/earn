import {
  Box,
  IconButton,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { BsPaperclip } from 'react-icons/bs';

interface ImagePopupProps {
  imageUrl: string;
}

const ImagePopup: React.FC<ImagePopupProps> = ({ imageUrl }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleOpen = (): void => setIsOpen(true);
  const handleClose = (): void => setIsOpen(false);

  return (
    <Box pos="relative" display="inline-block">
      <IconButton
        as={BsPaperclip}
        p={2}
        _hover={{ bg: 'brand.slate.200' }}
        aria-label="Open image"
        onClick={handleOpen}
        variant="ghost"
      />
      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={0}>
            <Image w="100%" h="auto" alt="Full size" src={imageUrl} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ImagePopup;

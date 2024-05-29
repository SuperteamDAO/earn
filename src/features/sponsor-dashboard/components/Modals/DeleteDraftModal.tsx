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
import axios from 'axios';
import React from 'react';
import { AiOutlineDelete } from 'react-icons/ai';

import { type ListingWithSubmissions } from '@/features/listings';

interface DeleteDraftModalProps {
  deleteDraftIsOpen: boolean;
  deleteDraftOnClose: () => void;
  listingId: string | undefined;
  listings: ListingWithSubmissions[];
  setListings: (listings: ListingWithSubmissions[]) => void;
  listingType: string | undefined;
}

export const DeleteDraftModal = ({
  listingId,
  listings,
  setListings,
  deleteDraftIsOpen,
  deleteDraftOnClose,
  listingType,
}: DeleteDraftModalProps) => {
  const deleteSelectedDraft = async () => {
    try {
      if (listingType === 'grant') {
        await axios.post(`/api/listings/delete/${listingId}`);
      } else {
        await axios.post(`/api/grants/delete/${listingId}`);
      }
      const update = listings.filter((x) => x.id !== listingId);
      setListings(update);
    } catch (e) {
      console.log(e);
    } finally {
      deleteDraftOnClose();
    }
  };
  return (
    <Modal isOpen={deleteDraftIsOpen} onClose={deleteDraftOnClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Delete Draft?</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text color="brand.slate.500">
            Are you sure you want to delete this draft listing?
          </Text>
          <br />
          <Text color="brand.slate.500">
            Note: If this was previously a published listing, all submissions or
            applications received for this listing will also be deleted.
          </Text>
        </ModalBody>

        <ModalFooter>
          <Button mr={4} onClick={deleteDraftOnClose} variant="ghost">
            Close
          </Button>
          <Button
            leftIcon={<AiOutlineDelete />}
            loadingText="Deleting..."
            onClick={deleteSelectedDraft}
            variant="solid"
          >
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

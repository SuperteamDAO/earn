import { ViewOffIcon } from '@chakra-ui/icons';
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
import React, { useState } from 'react';

import { type ListingWithSubmissions } from '@/features/listings';

interface UnpublishModalProps {
  unpublishIsOpen: boolean;
  unpublishOnClose: () => void;
  listingId: string | undefined;
  listings: ListingWithSubmissions[];
  setListings: (bounties: ListingWithSubmissions[]) => void;
  listingType: string | undefined;
}

export const UnpublishModal = ({
  unpublishIsOpen,
  unpublishOnClose,
  listingId,
  listings,
  setListings,
  listingType,
}: UnpublishModalProps) => {
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const changeBountyStatus = async (status: boolean) => {
    setIsChangingStatus(true);
    try {
      let result: any;
      if (listingType === 'grant') {
        result = await axios.post(`/api/grants/update/${listingId}/`, {
          isPublished: status,
        });
      } else {
        result = await axios.post(`/api/listings/update/${listingId}/`, {
          isPublished: status,
        });
      }

      const changedBountyIndex = listings.findIndex(
        (b) => b.id === result.data.id,
      );
      const newBounties = listings.map((listing, index) =>
        changedBountyIndex === index
          ? { ...listing, isPublished: result.data.isPublished }
          : listing,
      );
      setListings(newBounties);
      unpublishOnClose();
      setIsChangingStatus(false);
    } catch (e) {
      setIsChangingStatus(false);
    }
  };
  return (
    <Modal isOpen={unpublishIsOpen} onClose={unpublishOnClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Unpublish Listing?</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text color="brand.slate.500">
            This listing will be hidden from the homepage once unpublished. Are
            you sure you want to unpublish this listing?
          </Text>
        </ModalBody>

        <ModalFooter>
          <Button mr={4} onClick={unpublishOnClose} variant="ghost">
            Close
          </Button>
          <Button
            isLoading={isChangingStatus}
            leftIcon={<ViewOffIcon />}
            loadingText="Unpublishing..."
            onClick={() => changeBountyStatus(false)}
            variant="solid"
          >
            Unpublish
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

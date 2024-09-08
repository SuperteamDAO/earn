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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react';
import { AiOutlineDelete } from 'react-icons/ai';
import { toast } from 'sonner';

import { type ListingWithSubmissions } from '@/features/listings';
import { useUser } from '@/store/user';

interface DeleteDraftModalProps {
  deleteDraftIsOpen: boolean;
  deleteDraftOnClose: () => void;
  listingId: string | undefined;
  listingType: string | undefined;
}

export const DeleteDraftModal = ({
  listingId,
  deleteDraftIsOpen,
  deleteDraftOnClose,
  listingType,
}: DeleteDraftModalProps) => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (listingType === 'grant') {
        await axios.post(`/api/grants/delete/${listingId}`);
      } else {
        await axios.post(`/api/listings/delete/${listingId}`);
      }
    },
    onSuccess: () => {
      queryClient.setQueryData<ListingWithSubmissions[]>(
        ['dashboard', user?.currentSponsorId],
        (oldData) => (oldData ? oldData.filter((x) => x.id !== listingId) : []),
      );
      toast.success('Draft deleted successfully');
      deleteDraftOnClose();
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete draft. Please try again.');
    },
  });

  const deleteSelectedDraft = () => {
    deleteMutation.mutate();
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
            isLoading={deleteMutation.isPending}
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

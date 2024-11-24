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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react';
import { toast } from 'sonner';

import { type ListingWithSubmissions } from '@/features/listings';
import { useUser } from '@/store/user';

interface UnpublishModalProps {
  unpublishIsOpen: boolean;
  unpublishOnClose: () => void;
  listingId: string | undefined;
  listingType: string | undefined;
}

export const UnpublishModal = ({
  unpublishIsOpen,
  unpublishOnClose,
  listingId,
  listingType,
}: UnpublishModalProps) => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const updateMutation = useMutation({
    mutationFn: async (status: boolean) => {
      let result;
      if (listingType === 'grant') {
        result = await axios.post(`/api/grants/update/${listingId}/`, {
          isPublished: status,
        });
      } else {
        result = await axios.post(`/api/listings/update/${listingId}/`, {
          isPublished: status,
        });
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<ListingWithSubmissions[]>(
        ['dashboard', user?.currentSponsorId],
        (oldData) =>
          oldData
            ? oldData.map((listing) =>
              listing.id === data.id
                ? { ...listing, isPublished: data.isPublished }
                : listing,
            )
            : [],
      );
      toast.success('成功');
      unpublishOnClose();
    },
    onError: (error) => {
      console.error('Unpublish error:', error);
      toast.error('失败，请重试');
    },
  });

  const changeBountyStatus = (status: boolean) => {
    updateMutation.mutate(status);
  };

  return (
    <Modal isOpen={unpublishIsOpen} onClose={unpublishOnClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Unpublish Listing?</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text color="brand.slate.500">
            一旦未发布，此任务将从主页隐藏。你确定要取消发布吗？
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button mr={4} onClick={unpublishOnClose} variant="ghost">
            关闭
          </Button>
          <Button
            isLoading={updateMutation.isPending}
            leftIcon={<ViewOffIcon />}
            loadingText="取消发布中"
            onClick={() => changeBountyStatus(false)}
            variant="solid"
          >
            取消发布
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

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
      toast.success('成功');
      deleteDraftOnClose();
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('失败，请重试');
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
          <Text color="brand.slate.500">你确定要删除这份草稿吗？</Text>
          <br />
          <Text color="brand.slate.500">
            注意：如果此职位信息之前曾发布，则为此职位信息收到的所有提交或申请也将被删除。
          </Text>
        </ModalBody>

        <ModalFooter>
          <Button mr={4} onClick={deleteDraftOnClose} variant="ghost">
            Close
          </Button>
          <Button
            isLoading={deleteMutation.isPending}
            leftIcon={<AiOutlineDelete />}
            loadingText="正在删除"
            onClick={deleteSelectedDraft}
            variant="solid"
          >
            确认
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

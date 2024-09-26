import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react';
import { toast } from 'sonner';

import { type GrantApplicationWithUser } from '@/features/sponsor-dashboard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  onMarkCompleted: (updatedApplication: GrantApplicationWithUser) => void;
}
export function MarkCompleteModal({
  isOpen,
  onClose,
  applicationId,
  onMarkCompleted,
}: Props) {
  const cancelRef = React.useRef<HTMLButtonElement | null>(null);

  const markCompletedMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.get<GrantApplicationWithUser>(
        `/api/sponsor-dashboard/grants/update-ship-progress`,
        {
          params: {
            id: applicationId,
          },
        },
      );
      return response.data;
    },
    onSuccess: (updatedApplication) => {
      onMarkCompleted(updatedApplication);
      toast.success('Application Marked as Completed');
      onClose();
    },
    onError: (error) => {
      console.error(error);
      toast.error('Error marking application as completed. Please try again.');
    },
  });

  const handleMarkAsCompleted = () => {
    markCompletedMutation.mutate();
    onClose();
  };

  return (
    <>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Mark as Completed
            </AlertDialogHeader>

            <AlertDialogBody>
              We will inform the user that their grant project has been marked
              as completed. This will allow them to apply for this grant again.
              <br />
              <br />
              You cannot undo this action. Are you sure you want to mark this as
              completed?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant="ghost">
                Cancel
              </Button>
              <Button
                ml={3}
                bg="red.500"
                _hover={{
                  bg: 'red.400',
                }}
                onClick={handleMarkAsCompleted}
              >
                Mark as Completed
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}

export default MarkCompleteModal;

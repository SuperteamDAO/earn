import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import React from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
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
  const { mutate: markCompletedMutation, isPending: markCompletePending } =
    useMutation({
      mutationFn: async () => {
        const response = await axios.put<GrantApplicationWithUser>(
          `/api/sponsor-dashboard/grants/update-ship-progress`,
          {
            id: applicationId,
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
        if (error instanceof AxiosError) {
          if (
            (error.response?.data.error as string)
              .toLowerCase()
              .includes('airtable recipient')
          ) {
            toast.error('User has not filled the Grant Onboarding form');
            return;
          }
        }
        toast.error(
          'Error marking application as completed. Please try again.',
        );
      },
    });

  const handleMarkAsCompleted = () => {
    markCompletedMutation();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold">
            Mark as Completed
          </AlertDialogTitle>
        </AlertDialogHeader>

        <AlertDialogDescription className="space-y-4">
          <p>
            We will inform the user that their grant project has been marked as
            completed. This will allow them to apply for this grant again.
          </p>
          <p>
            You cannot undo this action. Are you sure you want to mark this as
            completed?
          </p>
        </AlertDialogDescription>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <Button
            className="ml-3 bg-red-500 hover:bg-red-400"
            disabled={markCompletePending}
            onClick={handleMarkAsCompleted}
          >
            {markCompletePending ? (
              <>
                <span className="loading loading-spinner" />
                Marking...
              </>
            ) : (
              'Mark as Completed'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

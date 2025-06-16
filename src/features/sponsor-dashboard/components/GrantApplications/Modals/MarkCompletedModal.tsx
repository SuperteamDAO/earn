import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Check } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';

import { type GrantApplicationWithUser } from '@/features/sponsor-dashboard/types';

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
        const response = await api.put<GrantApplicationWithUser>(
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="m-0 p-0" hideCloseIcon>
        <DialogTitle className="text-md -mb-1 px-6 pt-4 font-semibold text-slate-900">
          Mark as Completed
        </DialogTitle>
        <Separator />
        <div className="space-y-4 px-6 pb-6 text-[0.95rem]">
          <p className="text-slate-500">
            We will inform the user that their grant project has been marked as
            completed. This will allow them to apply for this grant again.
          </p>
          <p className="text-slate-500">
            You cannot undo this action. Are you sure you want to mark this as
            completed?
          </p>

          <div className="flex gap-3 pt-4">
            <div className="w-1/2" />
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={markCompletePending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-lg border border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100"
              disabled={markCompletePending}
              onClick={handleMarkAsCompleted}
            >
              {markCompletePending ? (
                <>
                  <span className="loading loading-spinner mr-2" />
                  <span>Marking...</span>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-blue-600 p-0.5">
                    <Check className="size-2 text-white" />
                  </div>
                  <span>Mark as Completed</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

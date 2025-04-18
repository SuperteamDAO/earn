import dayjs from 'dayjs';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

interface UpdatePaymentDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  listingId: string;
  currentPaymentDate?: string;
  onSuccess?: (date: string) => void;
}

export const UpdatePaymentDateModal = ({
  isOpen,
  onClose,
  submissionId,
  listingId,
  currentPaymentDate,
  onSuccess,
}: UpdatePaymentDateModalProps) => {
  const [newDate, setNewDate] = useState(currentPaymentDate || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    if (!newDate) {
      toast.error('Please enter a valid date');
      return;
    }

    if (dayjs(newDate).isAfter(dayjs())) {
      toast.error('You cannot update the payment date to a future date');
      return;
    }

    try {
      setIsLoading(true);
      await api.post('/api/sponsor-dashboard/listings/update-payment-date', {
        submissionId,
        listingId,
        paymentDate: newDate,
      });
      toast.success('Payment date updated successfully');
      onSuccess?.(newDate);
      onClose();
    } catch (error) {
      toast.error('Failed to update payment date');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Payment Date</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

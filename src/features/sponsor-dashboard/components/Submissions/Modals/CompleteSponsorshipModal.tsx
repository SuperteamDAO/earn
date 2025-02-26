import { AlertCircle, Trash } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CompleteSponsorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTransactionsVerified: boolean;
  onCompleteListing: () => Promise<void>;
  onReviewTransactions: () => void;
}

export const CompleteSponsorshipModal = ({
  isOpen,
  onClose,
  allTransactionsVerified,
  onCompleteListing,
  onReviewTransactions,
}: CompleteSponsorshipModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const handleCompleteListing = async () => {
    setLoading(true);
    try {
      await onCompleteListing();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {allTransactionsVerified
              ? 'Confirm Completion of Sponsorship Listing'
              : 'Warning: Incomplete Transaction Verification'}
          </DialogTitle>
        </DialogHeader>

        <div className="text-[0.95rem] font-medium">
          {allTransactionsVerified ? (
            <p className="mt-3 text-slate-500">
              Are you sure you want to mark this Sponsorship listing as
              complete?
              <br />
              <br />
              Once completed, no further submissions or modifications will be
              allowed. Please ensure that all contributions have been thoroughly
              reviewed and finalized before proceeding.
            </p>
          ) : (
            <p className="mt-3 text-slate-500">
              You cannot complete this Sponsorship listing because not all
              associated transactions have been verified.
              <br />
              <br />
              Please use the Transaction Verification button to review and
              verify all transaction links before proceeding.
            </p>
          )}

          <div className="mt-6 flex justify-end gap-8">
            {allTransactionsVerified ? (
              <>
                <Button variant="ghost" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button disabled={loading} onClick={handleCompleteListing}>
                  {loading ? (
                    <>
                      <span className="loading loading-spinner mr-2" />
                      Processing
                    </>
                  ) : (
                    <>
                      <Trash className="mr-2 h-4 w-4" />
                      Complete Listing
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    onReviewTransactions();
                    onClose();
                  }}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Review Transactions
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

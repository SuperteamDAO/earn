import { Check } from 'lucide-react'; // Import Check icon
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface BonusModalProps {
  bonusIsOpen: boolean;
  bonusOnClose: () => void;
  submissionIds: string[];
  onBonusSubmission: (submissionId: string[]) => void;
  allSubmissionsLength: number;
}

export const MultiBonusModal = ({
  bonusIsOpen,
  bonusOnClose,
  onBonusSubmission,
  submissionIds,
}: BonusModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  const assignBonus = async () => {
    setLoading(true);
    try {
      await onBonusSubmission(submissionIds);
    } catch (e) {
      console.error('Error assigning bonus:', e);
    } finally {
      setLoading(false);
      bonusOnClose();
    }
  };

  const isMultiple = submissionIds.length > 1;

  return (
    <Dialog open={bonusIsOpen} onOpenChange={bonusOnClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-md font-semibold text-slate-500">
            {`Assign Bonus to Submission${isMultiple ? 's' : ''}?`}
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <div className="text-[0.95rem] font-medium">
          <p className="mt-3 text-slate-500">
            {`You are about to assign bonus rank to ${submissionIds.length} submission${isMultiple ? 's' : ''}. Are you sure you want to proceed?`}
          </p>

          <br />

          <Button
            className="mb-3 w-full bg-emerald-600 text-white hover:bg-emerald-600/90"
            disabled={loading}
            onClick={assignBonus}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner mr-2" />
                <span>Assign Bonus</span>
              </>
            ) : (
              <>
                <div className="mr-2 rounded-full bg-white p-[3px]">
                  <Check className="h-2 w-2 stroke-3 text-emerald-600" />
                </div>
                {`Assign Bonus${isMultiple ? 'es' : ''}`}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

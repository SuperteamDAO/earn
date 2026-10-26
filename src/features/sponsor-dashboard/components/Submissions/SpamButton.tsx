'use client';

import { LucideFlag } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { SubmissionLabels } from '@/prisma/enums';

import {
  useRejectSubmissions,
  useReview,
  useUpdateLabel,
} from './review-state';
import { SpamConfirmationDialog } from './SpamConfirmationDialog';

interface Props {
  isMultiSelectOn: boolean;
}

export const SpamButton = ({ isMultiSelectOn }: Props) => {
  const { selected: selectedSubmission } = useReview();
  const [isSpamDialogOpen, setIsSpamDialogOpen] = useState(false);
  const [pendingSpamLabel, setPendingSpamLabel] = useState<{
    id: string;
    label: SubmissionLabels;
  } | null>(null);

  const rejectSubmissions = useRejectSubmissions();
  const updateLabel = useUpdateLabel();

  const handleSpamClick = () => {
    if (!selectedSubmission?.id) return;

    setPendingSpamLabel({
      id: selectedSubmission.id,
      label: SubmissionLabels.Spam,
    });
    setTimeout(() => {
      setIsSpamDialogOpen(true);
    }, 0);
  };

  // Spam is rejected too.
  const handleSpamConfirm = (id: string, label: SubmissionLabels) => {
    updateLabel([id], label)
      .then(() =>
        label === SubmissionLabels.Spam ? rejectSubmissions([id]) : undefined,
      )
      .catch((e: unknown) => console.error(e));
  };

  const isMarkedAsSpam = selectedSubmission?.label === SubmissionLabels.Spam;

  return (
    <>
      <Button
        variant="destructive"
        className={`rounded-lg border disabled:opacity-100 ${
          isMarkedAsSpam
            ? 'border-orange-300 bg-orange-100 text-orange-600 hover:bg-orange-200'
            : 'border-orange-200 bg-orange-50 text-orange-500 hover:bg-orange-100 disabled:opacity-70'
        }`}
        onClick={handleSpamClick}
        disabled={isMarkedAsSpam || isMultiSelectOn}
      >
        <LucideFlag className="size-1 text-orange-500" />
        {isMarkedAsSpam ? 'Marked as Spam' : 'Spam'}
      </Button>

      <SpamConfirmationDialog
        isOpen={isSpamDialogOpen}
        onClose={() => {
          setIsSpamDialogOpen(false);
          setPendingSpamLabel(null);
        }}
        submissionId={pendingSpamLabel?.id}
        onConfirm={handleSpamConfirm}
      />
    </>
  );
};

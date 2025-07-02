import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SubmissionLabels } from '@/interface/prisma/enums';

interface SpamConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string | undefined;
  listingSlug: string;
  onConfirm: (id: string, label: SubmissionLabels) => void;
}

export const SpamConfirmationDialog = ({
  isOpen,
  onClose,
  submissionId,
  onConfirm,
}: SpamConfirmationDialogProps) => {
  const handleConfirm = () => {
    if (!submissionId) return;
    onConfirm(submissionId, SubmissionLabels.Spam);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark this as spam?</AlertDialogTitle>
          <AlertDialogDescription>
            Marking a submission as &quot;Spam&quot; would deduct a submission
            credit from the applicant and flag it in our system. This change
            will only be reflected once you announce the winner(s).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-brand-purple hover:bg-brand-purple/90"
          >
            Understood
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

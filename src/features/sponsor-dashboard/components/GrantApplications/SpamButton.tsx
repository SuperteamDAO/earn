import { LucideFlag } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { postJson } from '@/lib/fetch-json';
import { SubmissionLabels } from '@/prisma/enums';

import { useRejectGrantApplications } from '../../mutations/useRejectGrantApplications';
import { SpamConfirmationDialog } from '../Submissions/SpamConfirmationDialog';
import { useGrantReview } from './GrantReviewContext';

interface Props {
  grantSlug: string;
  isMultiSelectOn: boolean;
}

export const SpamButton = ({ isMultiSelectOn }: Props) => {
  const {
    selectedApplication,
    setApplications,
    setStateUpdating: setLabelsUpdating,
  } = useGrantReview();
  const [isSpamDialogOpen, setIsSpamDialogOpen] = useState(false);
  const [pendingSpamLabel, setPendingSpamLabel] = useState<{
    id: string;
    label: SubmissionLabels;
  } | null>(null);

  const rejectGrantApplications = useRejectGrantApplications();

  const handleSpamClick = async () => {
    if (!selectedApplication?.id) return;

    setPendingSpamLabel({
      id: selectedApplication.id,
      label: SubmissionLabels.Spam,
    });
    setIsSpamDialogOpen(true);
  };

  const handleSpamConfirm = (id: string, label: SubmissionLabels) => {
    void updateLabel({ id, label });
  };

  const updateLabel = async ({
    id,
    label,
  }: {
    id: string;
    label: SubmissionLabels;
  }) => {
    setLabelsUpdating(true);
    try {
      await postJson('/api/sponsor-dashboard/grants/update-label/', {
        id,
        label,
      });
      setLabelsUpdating(false);
      if (label === SubmissionLabels.Spam) {
        rejectGrantApplications.mutate([id]);
      }
      setApplications((applications) =>
        applications.map((application) =>
          application.id === id ? { ...application, label } : application,
        ),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLabelsUpdating(false);
    }
  };

  const isMarkedAsSpam = selectedApplication?.label === SubmissionLabels.Spam;

  return (
    <>
      <Button
        variant="destructive"
        className={`rounded-lg border disabled:opacity-100 ${
          isMarkedAsSpam
            ? 'border-orange-300 bg-orange-100 text-orange-600 hover:bg-orange-200'
            : 'border-orange-200 bg-orange-50 text-orange-500 hover:bg-orange-100 disabled:opacity-70'
        }`}
        onClick={() => void handleSpamClick()}
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
        isListing={false}
      />
    </>
  );
};

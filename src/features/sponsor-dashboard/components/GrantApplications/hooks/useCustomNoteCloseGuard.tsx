import { useEffect, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { getCustomEmailPlainText } from '@/features/sponsor-dashboard/utils/customEmailSanitizer';

interface UseCustomNoteCloseGuardProps {
  customNote: string;
  isEnabled: boolean;
  onDiscard: () => void;
}

export const useCustomNoteCloseGuard = ({
  customNote,
  isEnabled,
  onDiscard,
}: UseCustomNoteCloseGuardProps) => {
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const hasUnsavedCustomNote =
    isEnabled && getCustomEmailPlainText(customNote).length > 0;

  useEffect(() => {
    if (!hasUnsavedCustomNote) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedCustomNote]);

  const requestClose = () => {
    if (hasUnsavedCustomNote) {
      setIsDiscardDialogOpen(true);
      return;
    }

    onDiscard();
  };

  const confirmClose = () => {
    setIsDiscardDialogOpen(false);
    onDiscard();
  };

  const discardChangesDialog = (
    <AlertDialog
      open={isDiscardDialogOpen}
      onOpenChange={setIsDiscardDialogOpen}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Your changes will be lost if you close this window.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmClose}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return {
    discardChangesDialog,
    requestClose,
    closeWithoutGuard: onDiscard,
  };
};

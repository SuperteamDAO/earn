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

interface Props {
  isOpen: boolean;
  newRegion: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UpdateLocationConfirmModal({
  isOpen,
  newRegion,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update location?</AlertDialogTitle>
          <AlertDialogDescription>
            A cooldown period of three weeks from now will apply if you change
            your location. You will not be able to submit to any listing that is
            geo-locked to {newRegion} until your cooldown period is over.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

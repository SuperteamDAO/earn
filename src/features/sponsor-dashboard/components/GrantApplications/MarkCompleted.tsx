import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useDisclosure } from '@/hooks/use-disclosure';

import { type GrantApplicationWithUser } from '../../types';
import { MarkCompleteModal } from './Modals/MarkCompletedModal';

interface Props {
  isCompleted: boolean;
  applicationId: string;
  onMarkCompleted: (updatedApplication: GrantApplicationWithUser) => void;
}

export function MarkCompleted({
  isCompleted,
  applicationId,
  onMarkCompleted,
}: Props) {
  const {
    isOpen: markAsCompletedIsOpen,
    onOpen: markAsCompletedOnOpen,
    onClose: markAsCompletedOnClose,
  } = useDisclosure();

  if (isCompleted) {
    return (
      <Button
        variant="ghost"
        className="pointer-events-none border-slate-300 text-slate-500"
      >
        <Check className="mr-2 h-4 w-4" />
        Completed
      </Button>
    );
  }

  return (
    <>
      <MarkCompleteModal
        isOpen={markAsCompletedIsOpen}
        onClose={markAsCompletedOnClose}
        applicationId={applicationId}
        onMarkCompleted={onMarkCompleted}
      />
      <Button
        variant="outline"
        onClick={markAsCompletedOnOpen}
        className="border-slate-300 text-slate-500"
      >
        <Check className="mr-2 h-4 w-4" />
        Mark Completed
      </Button>
    </>
  );
}

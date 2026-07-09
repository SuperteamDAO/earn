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
        className="pointer-events-none shrink-0 border-slate-300 px-2 text-sm text-slate-500 sm:px-3"
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
        className="shrink-0 rounded-lg border border-blue-500 bg-blue-50 px-2 text-[13px] text-blue-600 hover:bg-blue-100 sm:px-3 sm:text-sm"
        onClick={markAsCompletedOnOpen}
      >
        <div className="rounded-full bg-blue-600 p-0.5">
          <Check className="size-2 text-white" />
        </div>
        <span className="sm:hidden">Complete</span>
        <span className="hidden sm:inline">Mark as Completed</span>
      </Button>
    </>
  );
}

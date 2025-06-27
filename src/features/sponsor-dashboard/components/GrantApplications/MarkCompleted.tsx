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
        className="flex-1 rounded-lg border border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100"
        onClick={markAsCompletedOnOpen}
      >
        <>
          <div className="rounded-full bg-blue-600 p-0.5">
            <Check className="size-2 text-white" />
          </div>
          <span>Mark as Completed</span>
        </>
      </Button>
    </>
  );
}

import { CheckIcon } from '@chakra-ui/icons';
import { Button, type ButtonProps } from '@chakra-ui/react';

import { useDisclosure } from '@/hooks/use-disclosure';

import { type GrantApplicationWithUser } from '../../types';
import { MarkCompleteModal } from './Modals/MarkCompletedModal';

interface Props {
  buttonStyle?: ButtonProps;
  isCompleted: boolean;
  applicationId: string;
  onMarkCompleted: (updatedApplication: GrantApplicationWithUser) => void;
}
export function MarkCompleted({
  buttonStyle,
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
        color="brand.slate.500"
        borderColor="brand.slate.300"
        pointerEvents="none"
        leftIcon={<CheckIcon />}
        variant="ghost"
      >
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
        color="brand.slate.500"
        borderColor="brand.slate.300"
        leftIcon={<CheckIcon />}
        onClick={markAsCompletedOnOpen}
        variant="outline"
        {...buttonStyle}
      >
        Mark Completed
      </Button>
    </>
  );
}

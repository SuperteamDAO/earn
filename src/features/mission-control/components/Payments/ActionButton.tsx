import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  type ButtonProps,
  useDisclosure,
} from '@chakra-ui/react';
import React from 'react';

type ActionType = 'approve' | 'reject';
type ButtonSize = 'small' | 'normal';

interface ActionButtonProps extends Omit<ButtonProps, 'onClick' | 'size'> {
  action: ActionType;
  onConfirm: () => void;
  itemName?: string;
  size?: ButtonSize;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  onConfirm,
  itemName = 'item',
  size = 'normal',
  ...buttonProps
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getButtonStyles = (action: ActionType, size: ButtonSize) => {
    const baseStyles =
      action === 'approve'
        ? { bg: '#ECFDF5', color: '#059669', _hover: { bg: '#D1FAE5' } }
        : { bg: '#FEF2F2', color: '#EF4444', _hover: { bg: '#FEE2E2' } };

    return {
      ...baseStyles,
      fontSize: size === 'small' ? '12px' : '14px',
      padding: size === 'small' ? '4px 8px' : '6px 12px',
      height: size === 'small' ? '24px' : '32px',
    };
  };

  return (
    <>
      <Button
        leftIcon={
          action === 'approve' ? (
            <ApproveIcon size={size} />
          ) : (
            <RejectIcon size={size} />
          )
        }
        onClick={onOpen}
        {...getButtonStyles(action, size)}
        {...buttonProps}
        fontWeight={500}
      >
        {action === 'approve' ? 'Approve' : 'Reject'}
      </Button>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {action === 'approve' ? 'Approve' : 'Reject'} {itemName}
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to {action} this {itemName}? This action
              cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant="ghost">
                Cancel
              </Button>
              <Button
                ml={3}
                colorScheme={action === 'approve' ? 'green' : 'red'}
                onClick={handleConfirm}
              >
                {action === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

function ApproveIcon({ size = 'normal' }: { size?: ButtonSize }) {
  const dimensions = size === 'small' ? 14 : 17;
  return (
    <svg
      width={dimensions}
      height={dimensions}
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8.21138" cy="8.3845" r="8.03193" fill="#059669" />
      <path
        d="M4.67725 8.06325L7.24746 10.6335L11.7453 6.13559"
        stroke="white"
        strokeWidth="1.69618"
      />
    </svg>
  );
}

function RejectIcon({ size = 'normal' }: { size?: ButtonSize }) {
  const dimensions = size === 'small' ? 14 : 17;
  return (
    <svg
      width={dimensions}
      height={dimensions}
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8.24824" cy="8.3845" r="8.03193" fill="#E11D48" />
      <path
        d="M5.38186 11.9674L4.66528 11.2508L7.53158 8.38451L4.66528 5.51821L5.38186 4.80164L8.24816 7.66793L11.1145 4.80164L11.831 5.51821L8.96473 8.38451L11.831 11.2508L11.1145 11.9674L8.24816 9.10108L5.38186 11.9674Z"
        fill="white"
      />
    </svg>
  );
}

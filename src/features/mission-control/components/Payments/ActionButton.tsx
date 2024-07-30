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

import { type ButtonSize, type TSXTYPE } from '../../utils';
import { GrantApproveModal } from './GrantApproveModal';
import { GrantRejectModal } from './GrantRejectModal';
import { ApproveIcon, RejectIcon } from './Icons';

export type ActionType = 'approve' | 'reject';

interface ActionButtonProps extends Omit<ButtonProps, 'onClick' | 'size'> {
  action: ActionType;
  tsxType: TSXTYPE;
  onConfirm: (approvedAmount?: number) => void;
  itemName?: string;
  size?: ButtonSize;
  personName: string;
  request: number;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  onConfirm,
  tsxType,
  itemName = 'item',
  size = 'normal',
  personName,
  request: grantRequest,
  ...buttonProps
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const handleConfirm = (amount?: number) => {
    if (amount !== undefined) {
      // Handle grant approval with amount
      console.log(`Approved grant amount: ${amount}`);
    }
    onConfirm(amount);
    onClose();
  };

  const handleReject = (reason?: string) => {
    if (reason) {
      // Handle grant rejection with reason
      console.log(`Rejected grant with reason: ${reason}`);
    }
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

      {tsxType === 'grants' ? (
        action === 'approve' ? (
          <GrantApproveModal
            approveIsOpen={isOpen}
            approveOnClose={onClose}
            granteeName={personName}
            ask={grantRequest}
            approveFn={handleConfirm}
          />
        ) : (
          <GrantRejectModal
            rejectIsOpen={isOpen}
            rejectOnClose={onClose}
            granteeName={personName}
            ask={grantRequest}
            rejectFn={handleReject}
          />
        )
      ) : (
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
                  onClick={() => handleConfirm()}
                >
                  {action === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      )}
    </>
  );
};

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';

interface Props {
  onClose: () => void;
  isOpen: boolean;
  totalWinners: number;
  rewards: any;
}

function PublishResults({ isOpen, onClose, totalWinners, rewards }: Props) {
  let alertType:
    | 'loading'
    | 'info'
    | 'error'
    | 'warning'
    | 'success'
    | undefined = 'warning';
  let alertTitle = '';
  let alertDescription = '';
  if (rewards?.length && totalWinners !== rewards?.length) {
    const remainingWinners = (rewards?.length || 0) - totalWinners;
    alertType = 'error';
    alertTitle = 'Select All Winners!';
    alertDescription = `You still have to select ${remainingWinners} more ${
      remainingWinners === 1 ? 'winner' : 'winners'
    } before you can publish the results publicly.`;
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Publish Results</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {alertTitle && alertDescription && (
            <Alert status={alertType}>
              <AlertIcon boxSize={8} />
              <Box>
                <AlertTitle>{alertTitle}</AlertTitle>
                <AlertDescription>{alertDescription}</AlertDescription>
              </Box>
            </Alert>
          )}
        </ModalBody>
        <ModalFooter>
          <Button mr={4} onClick={onClose} variant="ghost">
            Close
          </Button>
          <Button
            isDisabled={rewards?.length && totalWinners !== rewards?.length}
            variant="solid"
          >
            Publish
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default PublishResults;

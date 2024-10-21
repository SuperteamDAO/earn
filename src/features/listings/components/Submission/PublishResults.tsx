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
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { useAtomValue } from 'jotai';
import { usePostHog } from 'posthog-js/react';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';

import {
  selectedSubmissionAtom,
  useToggleWinner,
} from '@/features/sponsor-dashboard';
import { type SubmissionWithUser } from '@/interface/submission';
import { dayjs } from '@/utils/dayjs';
import { cleanRewards } from '@/utils/rank';

import { type Listing } from '../../types';

interface Props {
  onClose: () => void;
  isOpen: boolean;
  totalWinners: number;
  totalPaymentsMade: number;
  bounty: Listing | undefined;
  remainings: { podiums: number; bonus: number } | null;
  submissions: SubmissionWithUser[];
  usedPositions: number[];
  setRemainings: Dispatch<
    SetStateAction<{ podiums: number; bonus: number } | null>
  >;
}

export function PublishResults({
  isOpen,
  onClose,
  totalWinners,
  totalPaymentsMade,
  bounty,
  remainings,
  submissions,
  usedPositions,
  setRemainings,
}: Props) {
  const [isPublishingResults, setIsPublishingResults] = useState(false);
  const [isWinnersAnnounced, setIsWinnersAnnounced] = useState(
    bounty?.isWinnersAnnounced,
  );
  const posthog = usePostHog();
  const isDeadlinePassed = dayjs().isAfter(bounty?.deadline);
  const isProject = bounty?.type === 'project';
  if (isProject) totalWinners = 1;
  // Overrdiding totalWinners if project coz position select is done here now for project only

  const rewards =
    cleanRewards(bounty?.rewards, true).length + (bounty?.maxBonusSpots || 0);

  let isWinnersAllSelected = !(
    remainings && remainings.podiums + remainings.bonus !== 0
  );
  if (isProject) isWinnersAllSelected = true;
  // Overrdiding isWinnersAllSelected if project coz position select is done here now for project only

  let alertType:
    | 'loading'
    | 'info'
    | 'error'
    | 'warning'
    | 'success'
    | undefined = 'warning';
  let alertTitle = '';
  let alertDescription = '';
  if (!isWinnersAllSelected) {
    const remainingWinners = (rewards || 0) - totalWinners;
    alertType = 'error';
    alertTitle = 'Select All Winners!';
    alertDescription = `You still have to select ${remainingWinners} more ${
      remainingWinners === 1 ? 'winner' : 'winners'
    } before you can publish the results publicly.`;
  } else if (rewards && totalPaymentsMade !== rewards) {
    const remainingPayments = (rewards || 0) - totalPaymentsMade;
    alertType = 'warning';
    alertTitle = 'Pay All Winners!';
    alertDescription = `Don't forget to pay your winners after publishing results. You have to pay to ${remainingPayments} ${
      remainingPayments === 1 ? 'winner' : 'winners'
    }.`;
  }

  const selectedSubmission = useAtomValue(selectedSubmissionAtom);
  const { mutateAsync: toggleWinner } = useToggleWinner(
    bounty,
    submissions,
    setRemainings,
    usedPositions,
  );

  const publishResults = async () => {
    if (!bounty?.id) return;
    setIsPublishingResults(true);
    try {
      if (isProject) {
        if (selectedSubmission?.id) {
          await toggleWinner({
            winnerPosition: 1,
            id: selectedSubmission?.id,
            isWinner: true,
          });
        }
      }
      await axios.post(`/api/listings/announce/${bounty?.id}/`);
      setIsWinnersAnnounced(true);
      setIsPublishingResults(false);
    } catch (e) {
      if (isProject) {
        if (selectedSubmission?.id) {
          await toggleWinner({
            winnerPosition: null,
            id: selectedSubmission?.id,
            isWinner: false,
          });
        }
      }
      setIsPublishingResults(false);
    }
  };

  useEffect(() => {
    if (!isWinnersAnnounced || bounty?.isWinnersAnnounced) return;
    const timer = setTimeout(() => {
      window.location.reload();
    }, 1500);
    return () => clearTimeout(timer);
  }, [isWinnersAnnounced]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Publish Results</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isWinnersAnnounced && (
            <Alert
              alignItems="center"
              justifyContent="center"
              flexDir="column"
              py={4}
              textAlign="center"
              status="success"
              variant="subtle"
            >
              <AlertIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                Results Announced Successfully!
              </AlertTitle>
              <AlertDescription maxW="sm">
                The results have been announced publicly. Everyone can view the
                results on the Bounty&apos;s page.
                <br />
                <br />
                {!bounty?.isWinnersAnnounced && (
                  <Text as="span" color="brand.slate.500" fontSize="sm">
                    Refreshing...
                  </Text>
                )}
              </AlertDescription>
            </Alert>
          )}
          {!isWinnersAnnounced &&
            rewards &&
            totalWinners === rewards &&
            alertType !== 'error' && (
              <Text mb={4}>
                Publishing the results of this listing will make the results
                public for everyone to see!
                <br />
                YOU CAN&apos;T GO BACK ONCE YOU PUBLISH THE RESULTS!
              </Text>
            )}
          {!isWinnersAnnounced && alertTitle && alertDescription && (
            <Alert status={alertType}>
              <AlertIcon boxSize={8} />
              <Box>
                <AlertTitle>{alertTitle}</AlertTitle>
                <AlertDescription>{alertDescription}</AlertDescription>
              </Box>
            </Alert>
          )}
          {!isWinnersAnnounced &&
            rewards &&
            totalWinners === rewards &&
            !isDeadlinePassed && (
              <Alert mt={4} status="error">
                <AlertIcon boxSize={8} />
                <Box>
                  <AlertTitle>Listing still in progress!</AlertTitle>
                  <AlertDescription>
                    If you publish the results before the deadline, the listing
                    will close since the winner(s) will have been announced.
                  </AlertDescription>
                </Box>
              </Alert>
            )}
        </ModalBody>
        <ModalFooter>
          {!isWinnersAnnounced && (
            <>
              <Button onClick={onClose} variant="ghost">
                Close
              </Button>
              <Button
                className="ph-no-capture"
                ml={4}
                isDisabled={!isWinnersAllSelected || alertType === 'error'}
                isLoading={isPublishingResults}
                loadingText={'Publishing...'}
                onClick={() => {
                  posthog.capture('announce winners_sponsor');
                  publishResults();
                }}
                variant="solid"
              >
                Publish
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

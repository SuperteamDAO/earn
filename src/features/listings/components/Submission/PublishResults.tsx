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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
    alertTitle = t('publishResults.selectAllWinners');
    alertDescription = t('publishResults.remainingWinnersToSelect', {
      count: remainingWinners,
    });
  } else if (rewards && totalPaymentsMade !== rewards) {
    const remainingPayments = (rewards || 0) - totalPaymentsMade;
    alertType = 'warning';
    alertTitle = t('publishResults.payAllWinners');
    alertDescription = t('publishResults.remainingPaymentsToMake', {
      count: remainingPayments,
    });
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
            ask: selectedSubmission?.ask,
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
            ask: selectedSubmission?.ask,
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
        <ModalHeader>{t('publishResults.publishResults')}</ModalHeader>
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
                {t('publishResults.resultsAnnouncedSuccessfully')}
              </AlertTitle>
              <AlertDescription maxW="sm">
                {t('publishResults.resultsAnnouncedPublicly')}
                <br />
                <br />
                {!bounty?.isWinnersAnnounced && (
                  <Text as="span" color="brand.slate.500" fontSize="sm">
                    {t('publishResults.refreshing')}
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
                {t('publishResults.publishingResultsDescription')}
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
          {bounty?.applicationType !== 'rolling' &&
            !isWinnersAnnounced &&
            rewards &&
            totalWinners === rewards &&
            !isDeadlinePassed && (
              <Alert mt={4} status="error">
                <AlertIcon boxSize={8} />
                <Box>
                  <AlertTitle>
                    {t('publishResults.listingStillInProgress')}
                  </AlertTitle>
                  <AlertDescription>
                    {t('publishResults.publishBeforeDeadlineWarning')}
                  </AlertDescription>
                </Box>
              </Alert>
            )}
        </ModalBody>
        <ModalFooter>
          {!isWinnersAnnounced && (
            <>
              <Button onClick={onClose} variant="ghost">
                {t('common.close')}
              </Button>
              <Button
                className="ph-no-capture"
                ml={4}
                isDisabled={!isWinnersAllSelected || alertType === 'error'}
                isLoading={isPublishingResults}
                loadingText={t('publishResults.publishing')}
                onClick={() => {
                  posthog.capture('announce winners_sponsor');
                  publishResults();
                }}
                variant="solid"
              >
                {t('publishResults.publish')}
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

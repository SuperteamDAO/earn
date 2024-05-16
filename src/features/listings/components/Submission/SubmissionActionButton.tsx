import { Button, Flex, Tooltip, useDisclosure } from '@chakra-ui/react';
import axios from 'axios';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useState,
} from 'react';

import { SurveyModal } from '@/components/Survey';
import { Superteams } from '@/constants/Superteam';
import { AuthWrapper } from '@/features/auth';
import {
  getListingDraftStatus,
  getRegionTooltipLabel,
  isDeadlineOver,
} from '@/features/listings';
import { userStore } from '@/store/user';

import { type Bounty } from '../../types';
import { WarningModal } from '../WarningModal';
import { EasterEgg } from './EasterEgg';
import { SubmissionModal } from './SubmissionModal';

interface Props {
  listing: Bounty;
  hasHackathonStarted: boolean;
  submissionNumber: number;
  setSubmissionNumber: Dispatch<SetStateAction<number>>;
}

export const SubmissionActionButton = ({
  listing,
  hasHackathonStarted,
  submissionNumber,
  setSubmissionNumber,
}: Props) => {
  const {
    id,
    status,
    isPublished,
    deadline,
    region,
    applicationLink,
    type,
    isWinnersAnnounced,
  } = listing;

  const [isUserSubmissionLoading, setIsUserSubmissionLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEasterEggOpen, setEasterEggOpen] = useState(false);

  const { userInfo } = userStore();

  function userRegionEligibilty() {
    if (region === 'GLOBAL') {
      return true;
    }

    const superteam = Superteams.find((st) => st.region === region);

    const isEligible =
      !!(
        userInfo?.location && superteam?.country.includes(userInfo?.location)
      ) || false;

    return isEligible;
  }

  const isUserEligibleByRegion = userRegionEligibilty();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    isOpen: warningIsOpen,
    onOpen: warningOnOpen,
    onClose: warningOnClose,
  } = useDisclosure();

  const regionTooltipLabel = getRegionTooltipLabel(region);

  const bountyDraftStatus = getListingDraftStatus(status, isPublished);

  const handleSubmit = () => {
    if (isAuthenticated) {
      if (applicationLink) {
        window.open(applicationLink, '_blank');
        return;
      }
      if (!userInfo?.isTalentFilled) {
        warningOnOpen();
      } else {
        onOpen();
      }
    }
  };

  const pastDeadline = isDeadlineOver(deadline) || isWinnersAnnounced;

  const getUserSubmission = async () => {
    setIsUserSubmissionLoading(true);
    try {
      const submissionDetails = await axios.get(`/api/submission/${id}/user/`);
      setIsSubmitted(!!submissionDetails?.data?.id);
      setIsUserSubmissionLoading(false);
    } catch (e) {
      setIsUserSubmissionLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfo?.id) return;
    getUserSubmission();
  }, [userInfo?.id]);

  const isProject = type === 'project';

  let buttonText;
  let buttonBG;
  let btnPointerEvents: any;
  let isBtnDisabled;
  let btnLoadingText;

  function getButtonState() {
    if (isSubmitted && !pastDeadline) return 'edit';
    if (isSubmitted && pastDeadline) return 'submitted';
    return 'submit';
  }

  const buttonState = getButtonState();

  switch (buttonState) {
    case 'edit':
      buttonText = isProject ? 'Edit Application' : 'Edit Submission';
      buttonBG = 'brand.purple';
      isBtnDisabled = false;
      btnLoadingText = null;
      break;

    case 'submitted':
      buttonText = isProject
        ? 'Applied Successfully'
        : 'Submitted Successfully';
      buttonBG = 'green.500';
      isBtnDisabled = true;
      btnLoadingText = null;
      break;

    default:
      buttonText = isProject ? 'Apply Now' : 'Submit Now';
      buttonBG = 'brand.purple';
      isBtnDisabled = Boolean(
        pastDeadline ||
          (userInfo?.id &&
            userInfo?.isTalentFilled &&
            (bountyDraftStatus === 'DRAFT' ||
              !hasHackathonStarted ||
              !isUserEligibleByRegion)),
      );
      btnLoadingText = 'Checking Submission..';
  }

  const {
    isOpen: isSurveyOpen,
    onOpen: onSurveyOpen,
    onClose: onSurveyClose,
  } = useDisclosure();

  const surveyId = '018c6743-c893-0000-a90e-f35d31c16692';

  const { status: authStatus } = useSession();

  const isAuthenticated = authStatus === 'authenticated';

  return (
    <>
      {isOpen && (
        <SubmissionModal
          id={id}
          onClose={onClose}
          isOpen={isOpen}
          submissionNumber={submissionNumber}
          setSubmissionNumber={setSubmissionNumber}
          setIsSubmitted={setIsSubmitted}
          editMode={buttonState === 'edit'}
          listing={listing}
          showEasterEgg={() => setEasterEggOpen(true)}
          onSurveyOpen={onSurveyOpen}
        />
      )}
      {isSurveyOpen &&
        (!userInfo?.surveysShown || !(surveyId in userInfo.surveysShown)) && (
          <SurveyModal
            isOpen={isSurveyOpen}
            onClose={onSurveyClose}
            surveyId={surveyId}
          />
        )}
      {warningIsOpen && (
        <WarningModal
          isOpen={warningIsOpen}
          onClose={warningOnClose}
          title={'Complete your profile'}
          bodyText={
            'Please complete your profile before submitting to a bounty.'
          }
          primaryCtaText={'Complete Profile'}
          primaryCtaLink={'/new/talent'}
        />
      )}
      {isEasterEggOpen && (
        <EasterEgg
          isOpen={isEasterEggOpen}
          onClose={() => setEasterEggOpen(false)}
          isProject={isProject}
        />
      )}
      <Image
        // Hack to show GIF Immediately when Easter Egg is visible
        src="/assets/memes/JohnCenaVibingToCupid.gif"
        alt="John Cena Vibing to Cupid"
        style={{
          width: '100%',
          marginTop: 'auto',
          display: 'block',
          visibility: 'hidden',
          position: 'fixed',
          zIndex: -99999,
          top: '-300%',
          left: '-300%',
        }}
        width="500"
        height="600"
        priority
        loading="eager"
        quality={80}
      />
      <Tooltip
        bg="brand.slate.500"
        hasArrow
        isDisabled={
          !userInfo?.id ||
          !userInfo?.isTalentFilled ||
          isUserEligibleByRegion ||
          pastDeadline
        }
        label={!isUserEligibleByRegion ? regionTooltipLabel : ''}
        rounded="md"
      >
        <Flex
          pos={{ base: 'fixed', md: 'static' }}
          zIndex={999}
          bottom={0}
          left="50%"
          w="full"
          px={{ base: 3, md: 0 }}
          py={{ base: 4, md: 0 }}
          bg="white"
          transform={{ base: 'translateX(-50%)', md: 'none' }}
        >
          <AuthWrapper style={{ w: 'full' }}>
            <Button
              w={'full'}
              mb={{ base: 0, md: 5 }}
              bg={buttonBG}
              _hover={{ bg: buttonBG }}
              _disabled={{
                opacity: { base: '96%', md: '70%' },
              }}
              pointerEvents={btnPointerEvents}
              isDisabled={isBtnDisabled}
              isLoading={isUserSubmissionLoading}
              loadingText={btnLoadingText}
              onClick={handleSubmit}
              size="lg"
              variant="solid"
            >
              {buttonText}
            </Button>
          </AuthWrapper>
        </Flex>
      </Tooltip>
    </>
  );
};

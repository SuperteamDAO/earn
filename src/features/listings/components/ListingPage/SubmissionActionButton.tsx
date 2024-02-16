import { Button, Tooltip, useDisclosure } from '@chakra-ui/react';
import axios from 'axios';
import dayjs from 'dayjs';
import moment from 'moment';
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useState,
} from 'react';

import { LoginWrapper } from '@/components/Header/LoginWrapper';
import { Superteams } from '@/constants/Superteam';
import { userStore } from '@/store/user';
import {
  getBountyDraftStatus,
  getRegionTooltipLabel,
  isDeadlineOver,
} from '@/utils/bounty';

import { type Bounty } from '../../types';
import { WarningModal } from '../WarningModal';
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
    Hackathon,
    eligibility,
  } = listing;

  const [triggerLogin, setTriggerLogin] = useState(false);
  const [isUserSubmissionLoading, setIsUserSubmissionLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const bountyDraftStatus = getBountyDraftStatus(status, isPublished);

  const handleSubmit = () => {
    if (applicationLink) {
      window.open(applicationLink, '_blank');
      return;
    }
    if (!userInfo?.id) {
      setTriggerLogin(true);
    } else if (!userInfo?.isTalentFilled) {
      warningOnOpen();
    } else {
      onOpen();
    }
  };

  const formattedDate = Hackathon
    ? dayjs(Hackathon.startDate).format('MMM DD')
    : null;

  const pastDeadline = isDeadlineOver(deadline);

  const getUserSubmission = async () => {
    setIsUserSubmissionLoading(true);
    try {
      const submissionDetails = await axios.get(`/api/submission/${id}/user/`, {
        params: {
          userId: userInfo?.id,
        },
      });
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
      buttonText = 'Edit Submission';
      buttonBG = 'brand.purple';
      isBtnDisabled = false;
      btnLoadingText = null;
      break;

    case 'submitted':
      buttonText = isProject
        ? 'Applied Successfully'
        : 'Submitted Successfully';
      buttonBG = 'green';
      isBtnDisabled = true;
      btnLoadingText = null;
      break;

    default:
      buttonText = isProject ? 'Apply Now' : 'Submit Now';
      buttonBG = 'brand.purple';
      isBtnDisabled = Boolean(
        userInfo?.id &&
          (bountyDraftStatus === 'DRAFT' ||
            Date.now() > Number(moment(deadline).format('x')) ||
            !hasHackathonStarted ||
            !isUserEligibleByRegion),
      );
      btnLoadingText = 'Checking Submission..';
  }

  return (
    <>
      {isOpen && (
        <SubmissionModal
          id={id}
          type={type}
          eligibility={eligibility || []}
          onClose={onClose}
          isOpen={isOpen}
          submissionNumber={submissionNumber}
          setSubmissionNumber={setSubmissionNumber}
          setIsSubmitted={setIsSubmitted}
          editMode={buttonState === 'edit'}
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

      <LoginWrapper
        triggerLogin={triggerLogin}
        setTriggerLogin={setTriggerLogin}
      />
      <Tooltip
        bg="brand.slate.500"
        hasArrow
        isDisabled={
          !userInfo?.id || (hasHackathonStarted && isUserEligibleByRegion)
        }
        label={
          !hasHackathonStarted
            ? `Submissions Open ${formattedDate}`
            : !isUserEligibleByRegion
              ? regionTooltipLabel
              : ''
        }
        rounded="md"
      >
        <Button
          w="full"
          bg={buttonBG}
          _hover={{ bg: buttonBG }}
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
      </Tooltip>
    </>
  );
};

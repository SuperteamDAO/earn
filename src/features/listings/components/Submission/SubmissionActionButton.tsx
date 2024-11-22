import { Button, Flex, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';
import { LuPencil } from 'react-icons/lu';

import { Tooltip } from '@/components/shared/responsive-tooltip';
import { SurveyModal } from '@/components/shared/Survey';
import { AuthWrapper } from '@/features/auth';
import {
  getListingDraftStatus,
  getRegionTooltipLabel,
  isDeadlineOver,
  type Listing,
  userRegionEligibilty,
} from '@/features/listings';
import { useUser } from '@/store/user';

import { userSubmissionQuery } from '../../queries/user-submission-status';
import { EasterEgg } from './EasterEgg';
import { SubmissionModal } from './SubmissionModal';

interface Props {
  listing: Listing;
  isTemplate?: boolean;
}

export const SubmissionActionButton = ({
  listing,
  isTemplate = false,
}: Props) => {
  const {
    id,
    status,
    isPublished,
    deadline,
    region,
    type,
    isWinnersAnnounced,
    Hackathon,
  } = listing;

  const [isEasterEggOpen, setEasterEggOpen] = useState(false);
  const { user } = useUser();

  const { status: authStatus } = useSession();

  const isAuthenticated = authStatus === 'authenticated';

  const isUserEligibleByRegion = userRegionEligibilty(region, user?.location);

  const { data: submissionStatus, isLoading: isUserSubmissionLoading } =
    useQuery({
      ...userSubmissionQuery(id!, user?.id),
      enabled: isAuthenticated,
    });

  const isSubmitted = submissionStatus?.isSubmitted ?? false;

  const posthog = usePostHog();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const regionTooltipLabel = getRegionTooltipLabel(region);

  const bountyDraftStatus = getListingDraftStatus(status, isPublished);

  const pastDeadline = isDeadlineOver(deadline) || isWinnersAnnounced;
  const buttonState = getButtonState();

  const handleSubmit = () => {
    if (buttonState === 'submit') {
      posthog.capture('start_submission');
    } else if (buttonState === 'edit') {
      posthog.capture('edit_submission');
    }
    onOpen();
  };

  const hackathonStartDate = Hackathon?.startDate
    ? dayjs(Hackathon?.startDate)
    : null;

  const hasHackathonStarted = hackathonStartDate
    ? dayjs().isAfter(hackathonStartDate)
    : true;

  const isProject = type === 'project';

  let buttonText;
  let buttonBG;
  let buttonTextColor;
  let isBtnDisabled;
  let btnLoadingText;

  function getButtonState() {
    if (isSubmitted && !pastDeadline) return 'edit';
    if (isSubmitted && pastDeadline) return 'submitted';
    return 'submit';
  }

  switch (buttonState) {
    case 'edit':
      buttonText = isProject ? 'Edit Application' : 'Edit Submission';
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
      if (
        listing.compensationType === 'variable' ||
        listing.compensationType === 'range'
      )
        buttonText = 'Send Quote';
      buttonBG = 'brand.purple';
      isBtnDisabled = Boolean(
        pastDeadline ||
        (user?.id &&
          user?.isTalentFilled &&
          ((bountyDraftStatus !== 'PUBLISHED' && status !== 'PREVIEW') ||
            !hasHackathonStarted ||
            !isUserEligibleByRegion)),
      );
      btnLoadingText = 'Checking Submission..';
  }
  if (isDeadlineOver(deadline) && !isWinnersAnnounced) {
    buttonText = 'Submissions in Review';
    buttonBG = 'gray.500';
  } else if (isWinnersAnnounced) {
    buttonText = 'Winners Announced';
    buttonBG = 'gray.500';
  }

  const {
    isOpen: isSurveyOpen,
    onOpen: onSurveyOpen,
    onClose: onSurveyClose,
  } = useDisclosure();

  const surveyId = ''; // TODO what is this

  return (
    <>
      {isOpen && (
        <SubmissionModal
          id={id}
          onClose={onClose}
          isOpen={isOpen}
          editMode={buttonState === 'edit'}
          listing={listing}
          isTemplate={isTemplate}
          showEasterEgg={() => setEasterEggOpen(true)}
          onSurveyOpen={onSurveyOpen}
        />
      )}
      {isSurveyOpen &&
        (!user?.surveysShown || !(surveyId in user.surveysShown)) && (
          <SurveyModal
            isOpen={isSurveyOpen}
            onClose={onSurveyClose}
            surveyId={surveyId}
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
        src="/assets/memes/jiesuan.gif"
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

      <Flex
        className="ph-no-capture"
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
        <AuthWrapper
          showCompleteProfileModal
          completeProfileModalBodyText={
            'Please complete your profile before submitting to a listing.'
          }
          style={{ w: 'full', cursor: 'pointer' }}
        >
          <Tooltip
            bg="brand.slate.500"
            hasArrow
            isDisabled={
              hasHackathonStarted && (isUserEligibleByRegion || pastDeadline)
            }
            label={
              !isUserEligibleByRegion
                ? regionTooltipLabel
                : !hasHackathonStarted
                  ? `This track will open for submissions on ${hackathonStartDate?.format('DD MMMM, YYYY')}`
                  : ''
            }
            rounded="md"
          >
            <Button
              gap={4}
              w={'full'}
              mb={{ base: 12, md: 5 }}
              textColor={buttonTextColor}
              bg={buttonBG}
              _hover={{ bg: buttonBG }}
              _disabled={{ opacity: '70%' }}
              isDisabled={isBtnDisabled}
              isLoading={isUserSubmissionLoading}
              loadingText={btnLoadingText}
              onClick={handleSubmit}
              size="lg"
              variant={buttonState === 'edit' ? 'outline' : 'solid'}
            >
              {buttonState === 'edit' && <LuPencil />}
              {buttonText}
            </Button>
          </Tooltip>
        </AuthWrapper>
      </Flex>
    </>
  );
};

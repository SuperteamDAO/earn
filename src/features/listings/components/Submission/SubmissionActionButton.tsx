import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Loader2, Pencil } from 'lucide-react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';

import { SurveyModal } from '@/components/shared/Survey';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

import { userSubmissionQuery } from '../../queries/user-submission-status';
import { type Listing } from '../../types';
import { isDeadlineOver } from '../../utils/deadline';
import {
  getRegionTooltipLabel,
  userRegionEligibilty,
} from '../../utils/region';
import { getListingDraftStatus } from '../../utils/status';
import { EasterEgg } from './EasterEgg';
import { SubmissionDrawer } from './SubmissionDrawer';

interface Props {
  listing: Listing;
  isTemplate?: boolean;
}

const InfoWrapper = ({
  children,
  isUserEligibleByRegion,
  hasHackathonStarted,
  regionTooltipLabel,
  hackathonStartDate,
  pastDeadline,
}: {
  children: React.ReactNode;
  isUserEligibleByRegion: boolean;
  hasHackathonStarted: boolean;
  regionTooltipLabel: string;
  hackathonStartDate: dayjs.Dayjs | null;
  pastDeadline: boolean;
}) => {
  return (
    <Tooltip
      disabled={hasHackathonStarted && (isUserEligibleByRegion || pastDeadline)}
      content={
        !isUserEligibleByRegion
          ? regionTooltipLabel
          : !hasHackathonStarted
            ? `This track will open for submissions on ${hackathonStartDate?.format('DD MMMM, YYYY')}`
            : null
      }
      contentProps={{ className: 'rounded-md' }}
      triggerClassName="w-full"
    >
      {children}
    </Tooltip>
  );
};

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

  const isUserEligibleByRegion = userRegionEligibilty({
    region,
    userLocation: user?.location,
  });

  const { data: submission, isLoading: isUserSubmissionLoading } = useQuery({
    ...userSubmissionQuery(id!, user?.id),
    enabled: isAuthenticated,
  });

  const isSubmitted = submission?.isSubmitted ?? false;
  const submissionStatus = submission?.status;
  const posthog = usePostHog();
  const router = useRouter();
  const { query } = router;

  const { isOpen, onOpen, onClose } = useDisclosure();

  const regionTooltipLabel = getRegionTooltipLabel(region);

  const bountyDraftStatus = getListingDraftStatus(status, isPublished);

  const pastDeadline = isDeadlineOver(deadline) || isWinnersAnnounced;
  const buttonState = getButtonState();

  const handleSubmit = () => {
    onOpen();
    if (buttonState === 'submit') {
      posthog.capture('start_submission');
    } else if (buttonState === 'edit') {
      posthog.capture('edit_submission');
    }
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
  let isBtnDisabled;
  let btnLoadingText;

  function getButtonState() {
    if (isSubmitted && !pastDeadline && submissionStatus === 'Rejected')
      return 'rejected';
    if (isSubmitted && !pastDeadline) return 'edit';
    if (isSubmitted && pastDeadline) return 'submitted';
    return 'submit';
  }

  switch (buttonState) {
    case 'rejected':
      buttonText = 'Application Rejected';
      buttonBG = 'bg-red-600';
      isBtnDisabled = true;
      btnLoadingText = null;
      break;
    case 'edit':
      buttonText = isProject ? 'Edit Application' : 'Edit Submission';
      isBtnDisabled = false;
      btnLoadingText = null;
      break;

    case 'submitted':
      buttonText = isProject
        ? 'Applied Successfully'
        : 'Submitted Successfully';
      buttonBG = 'bg-green-600';
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
      buttonBG = 'bg-brand-purple';
      isBtnDisabled = Boolean(
        pastDeadline ||
          (user?.id &&
            user?.isTalentFilled &&
            ((bountyDraftStatus !== 'PUBLISHED' && !query['preview']) ||
              !hasHackathonStarted ||
              !isUserEligibleByRegion)),
      );
      btnLoadingText = 'Checking Submission..';
  }
  if (isDeadlineOver(deadline) && !isWinnersAnnounced) {
    buttonText = 'Submissions in Review';
    buttonBG = 'bg-gray-500';
  } else if (isWinnersAnnounced) {
    buttonText = 'Winners Announced';
    buttonBG = 'bg-gray-500';
  }

  const {
    isOpen: isSurveyOpen,
    onOpen: onSurveyOpen,
    onClose: onSurveyClose,
  } = useDisclosure();

  const surveyId = '018c6743-c893-0000-a90e-f35d31c16692';

  return (
    <>
      {isOpen && (
        <SubmissionDrawer
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

      <div className="ph-no-capture fixed bottom-0 left-1/2 z-50 flex w-full -translate-x-1/2 bg-white px-3 py-4 md:static md:translate-x-0 md:px-0 md:py-0">
        <AuthWrapper
          showCompleteProfileModal
          completeProfileModalBodyText={
            'Please complete your profile before submitting to a listing.'
          }
          className="w-full"
        >
          <InfoWrapper
            isUserEligibleByRegion={isUserEligibleByRegion}
            hasHackathonStarted={hasHackathonStarted}
            regionTooltipLabel={regionTooltipLabel}
            hackathonStartDate={hackathonStartDate}
            pastDeadline={pastDeadline!}
          >
            <div className="w-full">
              <Button
                className={cn(
                  'h-12 w-full gap-4 text-lg',
                  'mb-12 md:mb-5',
                  'disabled:opacity-70',
                  buttonBG,
                  'hover:opacity-90',
                  buttonState === 'edit' &&
                    'border-brand-purple text-brand-purple hover:text-brand-purple-dark',
                )}
                disabled={isBtnDisabled}
                onClick={handleSubmit}
                variant={buttonState === 'edit' ? 'outline' : 'default'}
              >
                {isUserSubmissionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {btnLoadingText}
                  </>
                ) : (
                  <>
                    {buttonState === 'edit' && <Pencil />}
                    {buttonText}
                  </>
                )}
              </Button>
            </div>
          </InfoWrapper>
        </AuthWrapper>
      </div>
    </>
  );
};

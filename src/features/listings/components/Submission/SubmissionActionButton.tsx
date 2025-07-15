import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Loader2, Pencil } from 'lucide-react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React, { useState } from 'react';

import { SurveyModal } from '@/components/shared/Survey';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useCreditBalance } from '@/store/credit';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import { CreditIcon } from '@/features/credits/icon/credit';

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
  creditBalance,
  isProject,
  isBounty,
  isEditMode,
}: {
  children: React.ReactNode;
  isUserEligibleByRegion: boolean;
  hasHackathonStarted: boolean;
  regionTooltipLabel: string;
  hackathonStartDate: dayjs.Dayjs | null;
  pastDeadline: boolean;
  creditBalance: number;
  isProject: boolean;
  isBounty: boolean;
  isEditMode: boolean;
}) => {
  return (
    <Tooltip
      disabled={
        hasHackathonStarted &&
        (isUserEligibleByRegion || pastDeadline) &&
        !(
          creditBalance === 0 &&
          (isProject || isBounty) &&
          !isEditMode &&
          !pastDeadline
        )
      }
      content={
        !isUserEligibleByRegion
          ? regionTooltipLabel
          : !hasHackathonStarted
            ? `This track will open for submissions on ${hackathonStartDate?.format('DD MMMM, YYYY')}`
            : creditBalance === 0 && (isProject || isBounty)
              ? "You don't have enough credits to" +
                (isProject ? ' apply' : ' submit')
              : null
      }
      contentProps={{ className: 'rounded-md z-50' }}
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
  const { creditBalance } = useCreditBalance();

  const { authenticated, ready } = usePrivy();

  const isAuthenticated = authenticated;

  const isUserEligibleByRegion = userRegionEligibilty({
    region,
    userLocation: user?.location,
  });

  const { data: submission, isLoading: isUserSubmissionLoading } = useQuery({
    ...userSubmissionQuery(id!, user?.id),
    enabled: ready && isAuthenticated && !!user?.id,
  });

  const isSubmitted = submission?.isSubmitted ?? false;
  const submissionStatus = submission?.status;

  const router = useRouter();
  const { query } = router;

  const { isOpen, onOpen, onClose } = useDisclosure();

  const regionTooltipLabel = getRegionTooltipLabel(region);

  const bountyDraftStatus = getListingDraftStatus(status, isPublished);

  const pastDeadline = isDeadlineOver(deadline) || isWinnersAnnounced;
  const buttonState = getButtonState();

  const isEditMode = buttonState === 'edit';

  const handleSubmit = () => {
    onOpen();
    if (buttonState === 'submit') {
      posthog.capture('start_submission');
    } else if (isEditMode) {
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
  const isBounty = type === 'bounty';
  const isHackathon = type === 'hackathon';

  let buttonText;
  let buttonBG;
  let isBtnDisabled;
  let btnLoadingText;
  let isSubmitDisabled = false;

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
            (!hasHackathonStarted || !isUserEligibleByRegion)) ||
          !hasHackathonStarted ||
          (creditBalance === 0 && (isProject || isBounty)),
      );
      isSubmitDisabled = Boolean(
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

  const requiresCredits =
    (isProject || isBounty) &&
    user &&
    !isEditMode &&
    !isUserSubmissionLoading &&
    !pastDeadline &&
    isAuthenticated;

  const hackathonCreditConditions =
    isHackathon &&
    user &&
    !isEditMode &&
    !isUserSubmissionLoading &&
    !pastDeadline &&
    isAuthenticated;

  return (
    <>
      {isOpen && (
        <SubmissionDrawer
          isSubmitDisabled={isSubmitDisabled}
          id={id}
          onClose={onClose}
          isOpen={isOpen}
          editMode={isEditMode}
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

      <div className="ph-no-capture w-full md:px-0 md:pb-3">
        <div className="flex items-center gap-2">
          <InfoWrapper
            isUserEligibleByRegion={isUserEligibleByRegion}
            hasHackathonStarted={hasHackathonStarted}
            regionTooltipLabel={regionTooltipLabel}
            hackathonStartDate={hackathonStartDate}
            pastDeadline={pastDeadline!}
            creditBalance={creditBalance}
            isProject={isProject}
            isBounty={isBounty}
            isEditMode={isEditMode}
          >
            <AuthWrapper
              showCompleteProfileModal
              completeProfileModalBodyText={
                'Please complete your profile before submitting to a listing.'
              }
              className="w-full"
            >
              <div className="w-full">
                <Button
                  className={cn(
                    'h-12 w-full gap-4',
                    'disabled:opacity-70',
                    'text-base md:text-lg',
                    'font-semibold sm:font-medium',
                    buttonBG,
                    'hover:opacity-90',
                    isEditMode &&
                      'border-brand-purple text-brand-purple hover:text-brand-purple-dark',
                  )}
                  disabled={isBtnDisabled}
                  onClick={handleSubmit}
                  variant={isEditMode ? 'outline' : 'default'}
                >
                  {isUserSubmissionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>{btnLoadingText}</span>
                    </>
                  ) : (
                    <>
                      {isEditMode && <Pencil />}
                      <span>{buttonText}</span>
                      {requiresCredits && (
                        <CreditIcon className="-ml-2.5 size-6" />
                      )}
                    </>
                  )}
                </Button>
              </div>
            </AuthWrapper>
          </InfoWrapper>
        </div>
        {requiresCredits && (
          <div className="mt-1 md:my-1.5 md:flex">
            {creditBalance > 0 && (
              <p className="bg-brand-purple/20 mx-auto w-full rounded-md py-0.5 text-center text-xs font-medium text-slate-500 md:text-xs">
                {`* Costs 1 credit to ${isProject ? 'apply' : 'submit'}`}
              </p>
            )}
            {creditBalance <= 0 && (
              <p className="mx-auto w-full rounded-md bg-red-100 py-0.5 text-center text-xs font-medium text-red-400 md:text-xs">
                {`* You don't have enough credits to ${isProject ? 'apply' : 'submit'}`}
              </p>
            )}
          </div>
        )}
        {hackathonCreditConditions && (
          <div className="mt-1 md:my-1.5 md:flex">
            <p className="mx-auto w-full rounded-md bg-[#62F6FF10] py-0.5 text-center text-xs font-medium text-[#1A7F86] md:text-xs">
              Hackathon tracks do not require credits
            </p>
          </div>
        )}
      </div>
    </>
  );
};

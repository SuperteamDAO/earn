import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Loader2, Pencil } from 'lucide-react';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';

import { SurveyModal } from '@/components/shared/Survey';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useCreditBalance } from '@/store/credit';
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
import { ShareListing } from '../ListingPage/ShareListing';
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
}) => {
  return (
    <Tooltip
      disabled={
        hasHackathonStarted &&
        (isUserEligibleByRegion || pastDeadline) &&
        !(creditBalance === 0 && (isProject || isBounty))
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
  const isBounty = type === 'bounty';

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

  return (
    <>
      {isOpen && (
        <SubmissionDrawer
          isSubmitDisabled={isSubmitDisabled}
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

      <div className="ph-no-capture fixed bottom-0 left-1/2 z-50 mb-1 w-full -translate-x-1/2 border-t-1 border-slate-100 bg-white px-3 py-4 pt-2 pb-14 md:static md:translate-x-0 md:border-t-0 md:border-transparent md:px-0 md:py-0 md:pb-5">
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <ShareListing source="listing" className="h-12" listing={listing} />
          </div>
          <InfoWrapper
            isUserEligibleByRegion={isUserEligibleByRegion}
            hasHackathonStarted={hasHackathonStarted}
            regionTooltipLabel={regionTooltipLabel}
            hackathonStartDate={hackathonStartDate}
            pastDeadline={pastDeadline!}
            creditBalance={creditBalance}
            isProject={isProject}
            isBounty={isBounty}
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
                    // 'mb-12 md:mb-5',
                    'disabled:opacity-70',
                    'text-sm sm:text-base md:text-lg',
                    'font-semibold sm:font-medium',
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
                      <span>{btnLoadingText}</span>
                    </>
                  ) : (
                    <>
                      {buttonState === 'edit' && <Pencil />}
                      <span>{buttonText}</span>
                    </>
                  )}
                </Button>
              </div>
            </AuthWrapper>
          </InfoWrapper>
        </div>
        {(isProject || isBounty) &&
          user &&
          !(buttonState === 'edit') &&
          !isUserSubmissionLoading &&
          !pastDeadline && (
            <>
              {creditBalance > 0 && (
                <div className="my-1 hidden text-center text-xs font-medium text-slate-500 md:my-1.5 md:flex md:text-xs">
                  <p className="mx-auto w-full rounded-md bg-slate-200 py-0 md:py-0.5">
                    {`* Costs 1 credit to ${isProject ? 'apply' : 'submit'}`}
                  </p>
                </div>
              )}
              {creditBalance <= 0 && (
                <div className="mt-1 text-center text-xs font-medium text-red-400 md:my-1.5 md:text-xs">
                  <p className="mx-auto w-full rounded-md bg-red-100 py-0 md:py-0.5">
                    {`* You don't have enough credits to ${isProject ? 'apply' : 'submit'}`}
                  </p>
                </div>
              )}
            </>
          )}
      </div>
    </>
  );
};

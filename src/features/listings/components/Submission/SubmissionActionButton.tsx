import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Loader2, Pencil } from 'lucide-react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useServerTimeSync } from '@/hooks/use-server-time';
import { useCreditBalance } from '@/store/credit';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import { chaptersQuery } from '@/features/chapters/queries/chapters';
import { CreditIcon } from '@/features/credits/icon/credit';

import { userSubmissionQuery } from '../../queries/user-submission-status';
import { type Listing } from '../../types';
import { isDeadlineOver } from '../../utils/deadline';
import {
  getLocationCooldown,
  locationCooldownTooltip,
} from '../../utils/locationCooldown';
import {
  getRegionTooltipLabel,
  userRegionEligibilty,
} from '../../utils/region';
import { getListingDraftStatus } from '../../utils/status';
import { EasterEgg } from './EasterEgg';
import { KYCModal } from './KYCModal';
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
  isBounty,
  isEditMode,
  isAuthenticated,
  isLocationCooldown,
  locationCooldownLabel,
}: {
  children: React.ReactNode;
  isUserEligibleByRegion: boolean;
  hasHackathonStarted: boolean;
  regionTooltipLabel: string;
  hackathonStartDate: dayjs.Dayjs | null;
  pastDeadline: boolean;
  creditBalance: number;
  isBounty: boolean;
  isEditMode: boolean;
  isAuthenticated: boolean;
  isLocationCooldown: boolean;
  locationCooldownLabel: string;
}) => {
  const { user } = useUser();
  return (
    <Tooltip
      disabled={
        !isAuthenticated ||
        (isAuthenticated && user?.id && !user?.isTalentFilled) ||
        (!isLocationCooldown &&
          hasHackathonStarted &&
          (isUserEligibleByRegion || pastDeadline) &&
          !(creditBalance === 0 && isBounty && !isEditMode && !pastDeadline))
      }
      content={
        !isUserEligibleByRegion
          ? regionTooltipLabel
          : isLocationCooldown
            ? locationCooldownLabel
            : !hasHackathonStarted
              ? `This track will open for submissions on ${hackathonStartDate?.format('DD MMMM, YYYY')}`
              : creditBalance === 0 && isBounty
                ? "You don't have enough credits to submit"
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
    isFndnPaying,
    Hackathon,
  } = listing;

  const [isEasterEggOpen, setEasterEggOpen] = useState(false);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);

  const { user } = useUser();
  const { creditBalance } = useCreditBalance();
  const { data: chapters = [] } = useQuery(chaptersQuery);

  const { authenticated, ready } = usePrivy();

  const isAuthenticated = authenticated;

  const isUserEligibleByRegion = userRegionEligibilty({
    region,
    userLocation: user?.location,
    chapters,
  });

  const locationCooldown = getLocationCooldown({
    locationUpdatedAt: user?.locationUpdatedAt ?? null,
    listingRegion: region,
    userLocation: user?.location,
    chapters,
  });
  const isLocationCooldown = locationCooldown.inCooldown;
  const locationCooldownLabel = isLocationCooldown
    ? locationCooldownTooltip(locationCooldown.daysRemaining)
    : '';

  const { data: submission, isLoading: isUserSubmissionLoading } = useQuery({
    ...userSubmissionQuery(id!, user?.id),
    enabled: ready && isAuthenticated && !!user?.id,
  });

  const isSubmitted = submission?.isSubmitted ?? false;
  const submissionStatus = submission?.status;

  const router = useRouter();
  const { query } = router;

  const { isOpen, onOpen, onClose } = useDisclosure();

  const { serverTime, manualSync } = useServerTimeSync();

  const regionTooltipLabel = getRegionTooltipLabel(region, false, chapters);

  const bountyDraftStatus = getListingDraftStatus(status, isPublished);

  const pastDeadline =
    isDeadlineOver(deadline, serverTime()) || isWinnersAnnounced;
  const buttonState = getButtonState();

  const isEditMode = buttonState === 'edit';

  const handleSubmit = () => {
    void manualSync();
    if (buttonState === 'kyc') {
      setIsKYCModalOpen(true);
    } else {
      onOpen();
      if (buttonState === 'submit') {
        posthog.capture('start_submission');
      } else if (isEditMode) {
        posthog.capture('edit_submission');
      }
    }
  };

  const hackathonStartDate = Hackathon?.startDate
    ? dayjs(Hackathon?.startDate)
    : null;

  const hasHackathonStarted = hackathonStartDate
    ? dayjs(serverTime()).isAfter(hackathonStartDate)
    : true;

  const isBounty = type === 'bounty';
  const isHackathon = type === 'hackathon';

  const isListingSponsor = user?.currentSponsorId === listing.sponsorId;
  const isNotPublished = bountyDraftStatus !== 'PUBLISHED' && !query['preview'];

  let buttonText;
  let buttonBG;
  let isBtnDisabled;
  let btnLoadingText;
  let isSubmitDisabled = false;

  function getButtonState() {
    const isWinnerKycFlow =
      isWinnersAnnounced &&
      isFndnPaying &&
      submission?.isWinner &&
      dayjs(listing.winnersAnnouncedAt).isAfter(dayjs.utc('2025-08-06'));

    if (isWinnerKycFlow) {
      if (!submission?.isKYCVerified) {
        return 'kyc';
      }
      if (submission?.isKYCVerified && !submission.isPaid) {
        return 'kyc_done';
      }
      if (submission?.isKYCVerified && submission.isPaid) {
        return 'paid';
      }
    }

    if (isSubmitted && !pastDeadline && submissionStatus === 'Rejected')
      return 'rejected';
    if (isSubmitted && !pastDeadline) return 'edit';
    if (isSubmitted && pastDeadline) return 'submitted';
    return 'submit';
  }

  switch (buttonState) {
    case 'rejected':
      buttonText = 'Submission Marked as Spam';
      buttonBG = 'bg-red-600';
      isBtnDisabled = true;
      btnLoadingText = null;
      break;
    case 'edit':
      buttonText = 'Edit Submission';
      isBtnDisabled = false;
      btnLoadingText = null;
      break;

    case 'submitted':
      buttonText = 'Submitted Successfully';
      buttonBG = 'bg-green-600';
      isBtnDisabled = true;
      btnLoadingText = null;
      break;

    case 'kyc':
      buttonText = 'Submit KYC';
      buttonBG = 'bg-brand-purple';
      isBtnDisabled = false;
      btnLoadingText = null;
      break;

    case 'kyc_done':
      buttonText = 'Processing Payment';
      buttonBG = 'bg-green-600';
      isBtnDisabled = true;
      btnLoadingText = null;
      break;

    case 'paid':
      buttonText = 'Payment Successful';
      buttonBG = 'bg-green-600';
      isBtnDisabled = true;
      btnLoadingText = null;
      break;

    default:
      buttonText = 'Submit Now';
      buttonBG = 'bg-brand-purple';
      if (isNotPublished && !isListingSponsor) {
        buttonText = 'Paused';
      }
      isBtnDisabled = Boolean(
        pastDeadline ||
        (user?.id &&
          user?.isTalentFilled &&
          (!hasHackathonStarted || !isUserEligibleByRegion)) ||
        (!isAuthenticated ? false : !hasHackathonStarted) ||
        (isAuthenticated &&
          user?.id &&
          user?.isTalentFilled &&
          creditBalance === 0 &&
          isBounty) ||
        (isNotPublished && !isListingSponsor),
      );
      isSubmitDisabled = Boolean(
        pastDeadline ||
        (user?.id &&
          user?.isTalentFilled &&
          (isNotPublished || !hasHackathonStarted || !isUserEligibleByRegion)),
      );
      btnLoadingText = 'Checking Submission..';
      break;
  }

  if (isLocationCooldown && buttonState === 'submit') {
    buttonText = 'Ineligible';
    buttonBG = 'bg-brand-purple-400';
    isBtnDisabled = true;
    isSubmitDisabled = true;
  }

  if (isDeadlineOver(deadline, serverTime()) && !isWinnersAnnounced) {
    buttonText = 'Submissions in Review';
    buttonBG = 'bg-gray-500';
  } else if (
    isWinnersAnnounced &&
    !['kyc', 'kyc_done', 'paid'].includes(buttonState)
  ) {
    buttonText = 'Winners Announced';
    buttonBG = 'bg-gray-500';
  }

  const requiresCredits =
    isBounty &&
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
          showEasterEgg={() => {
            setEasterEggOpen(true);
          }}
        />
      )}
      {isEasterEggOpen && (
        <EasterEgg
          isOpen={isEasterEggOpen}
          onClose={() => setEasterEggOpen(false)}
        />
      )}
      {isKYCModalOpen && submission?.id && (
        <KYCModal
          isOpen={isKYCModalOpen}
          listingId={id!}
          onClose={() => setIsKYCModalOpen(false)}
          submissionId={submission.id}
        />
      )}

      <div className="ph-no-capture w-full">
        <div className="flex items-center gap-2">
          <InfoWrapper
            isUserEligibleByRegion={isUserEligibleByRegion}
            hasHackathonStarted={hasHackathonStarted}
            regionTooltipLabel={regionTooltipLabel}
            hackathonStartDate={hackathonStartDate}
            pastDeadline={pastDeadline!}
            creditBalance={creditBalance}
            isBounty={isBounty}
            isEditMode={isEditMode}
            isAuthenticated={isAuthenticated}
            isLocationCooldown={isLocationCooldown}
            locationCooldownLabel={locationCooldownLabel}
          >
            <AuthWrapper
              showCompleteProfileModal
              completeProfileModalBodyText={
                'Please complete your profile before submitting to a listing.'
              }
              className="w-full"
            >
              <div className="relative w-full">
                <Button
                  className={cn(
                    'h-12 w-full gap-4',
                    'disabled:cursor-default',
                    'disabled:opacity-70',
                    'text-base md:text-lg',
                    'font-semibold sm:font-semibold',
                    buttonBG,
                    isEditMode &&
                      'border-brand-purple text-brand-purple hover:text-brand-purple-dark',
                  )}
                  disabled={isBtnDisabled}
                  onClick={handleSubmit}
                  variant={isEditMode ? 'outline' : 'default'}
                >
                  {isUserSubmissionLoading ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
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
        {requiresCredits && user?.isTalentFilled && (
          <div className="mt-1 md:my-1.5 md:flex">
            {creditBalance > 0 && (
              <p className="mx-auto w-full rounded-md bg-gray-50 py-2 text-center text-xs text-slate-600 md:text-xs">
                {`* Costs 1 credit to submit`}
              </p>
            )}
            {creditBalance <= 0 && (
              <p className="mx-auto w-full rounded-md py-0.5 text-center text-xs text-slate-600 md:text-xs">
                {`* You don't have enough credits to submit`}
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

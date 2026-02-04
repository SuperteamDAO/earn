import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ArrowRight, Gift, Loader2, Lock, Pencil, X } from 'lucide-react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Tooltip } from '@/components/ui/tooltip';
import { SIX_MONTHS } from '@/constants/SIX_MONTHS';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useServerTimeSync } from '@/hooks/use-server-time';
import { useCreditBalance } from '@/store/credit';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import { Nudge } from '@/features/credits/components/Nudge';
import { ReferralModal } from '@/features/credits/components/ReferralModal';
import { CreditIcon } from '@/features/credits/icon/credit';
import { SurveyModal } from '@/features/listings/components/Submission/Survey';
import { ProBadge } from '@/features/pro/components/ProBadge';

import { userSubmissionQuery } from '../../queries/user-submission-status';
import { type Listing } from '../../types';
import { isDeadlineOver } from '../../utils/deadline';
import {
  checkKycCountryMatchesRegion,
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
  isProject,
  isBounty,
  isEditMode,
  isAuthenticated,
  isPro,
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
  isAuthenticated: boolean;
  isPro: boolean;
}) => {
  const { user } = useUser();
  return (
    <Tooltip
      disabled={
        !isAuthenticated ||
        (isAuthenticated && user?.id && !user?.isTalentFilled) ||
        (hasHackathonStarted &&
          (isUserEligibleByRegion || pastDeadline) &&
          !(
            creditBalance === 0 &&
            (isProject || isBounty) &&
            !isPro &&
            !isEditMode &&
            !pastDeadline
          ))
      }
      content={
        !isUserEligibleByRegion
          ? regionTooltipLabel
          : !hasHackathonStarted
            ? `This track will open for submissions on ${hackathonStartDate?.format('DD MMMM, YYYY')}`
            : creditBalance === 0 && (isProject || isBounty) && !isPro
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
    isFndnPaying,
    Hackathon,
    isPro,
  } = listing;

  const [isEasterEggOpen, setEasterEggOpen] = useState(false);
  const [isNudgeOpen, setNudgeOpen] = useState(false);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);

  const { user } = useUser();
  const { creditBalance } = useCreditBalance();

  const { authenticated, ready } = usePrivy();

  const isAuthenticated = authenticated;
  const isDesktop = useMediaQuery('(min-width: 768px)');

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

  const { serverTime, manualSync } = useServerTimeSync();

  const regionTooltipLabel = getRegionTooltipLabel(region);

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

  const {
    isOpen: isReferralOpen,
    onOpen: onReferralOpen,
    onClose: onReferralClose,
  } = useDisclosure();

  const openReferralWithEvent = () => {
    posthog.capture('open_referrals');
    onReferralOpen();
  };

  const isProject = type === 'project';
  const isBounty = type === 'bounty';
  const isHackathon = type === 'hackathon';

  const isUserPro = user?.isPro;

  const isListingSponsor = user?.currentSponsorId === listing.sponsorId;
  const isNotPublished = bountyDraftStatus !== 'PUBLISHED' && !query['preview'];

  let buttonText;
  let buttonBG;
  let isBtnDisabled;
  let btnLoadingText;
  let isSubmitDisabled = false;

  function getButtonState() {
    if (listing.agentAccess === 'AGENT_ONLY') {
      return 'agent_only';
    }

    if (
      isWinnersAnnounced &&
      isFndnPaying &&
      submission?.isWinner &&
      dayjs(listing.winnersAnnouncedAt).isAfter(dayjs.utc('2025-08-06'))
    ) {
      const isKycExpired =
        !submission?.kycVerifiedAt ||
        Date.now() - new Date(submission.kycVerifiedAt).getTime() > SIX_MONTHS;

      if (!submission?.isKYCVerified || isKycExpired) {
        return 'kyc';
      }
      if (submission?.isKYCVerified && !isKycExpired && !submission.isPaid) {
        const kycCountryCheck = checkKycCountryMatchesRegion(
          submission?.kycCountry,
          submission?.listingRegion || listing.region,
        );
        if (!kycCountryCheck.isValid) {
          return 'kyc_rejected';
        }
        return 'kyc_done';
      }
      if (submission?.isKYCVerified && !isKycExpired && submission.isPaid) {
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
    case 'agent_only':
      buttonText = 'Agent Only';
      buttonBG = 'bg-zinc-300';
      isBtnDisabled = true;
      isSubmitDisabled = true;
      btnLoadingText = null;
      break;
    case 'rejected':
      buttonText = isProject
        ? 'Application Rejected'
        : 'Submission Marked as Spam';
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

    case 'kyc_rejected':
      buttonText = 'KYC Rejected';
      buttonBG = 'bg-red-600';
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
      if (
        isPro &&
        !isUserPro &&
        !isListingSponsor &&
        buttonState === 'submit' &&
        !isUserSubmissionLoading
      ) {
        if (!isAuthenticated) {
          buttonText = 'Check Eligibility';
          buttonBG = 'bg-zinc-700';
          isBtnDisabled = false;
        } else {
          buttonText = 'Not Eligible';
          buttonBG = 'bg-zinc-300';
          isBtnDisabled = true;
        }
        btnLoadingText = null;
      } else {
        buttonText = isProject ? 'Apply Now' : 'Submit Now';
        if (
          listing.compensationType === 'variable' ||
          listing.compensationType === 'range'
        )
          buttonText = 'Send Quote';
        buttonBG = isUserPro && isPro ? 'bg-zinc-800' : 'bg-brand-purple';
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
              (isProject || isBounty) &&
              !isPro) ||
            (isNotPublished && !isListingSponsor),
        );
        isSubmitDisabled = Boolean(
          pastDeadline ||
            (user?.id &&
              user?.isTalentFilled &&
              (isNotPublished ||
                !hasHackathonStarted ||
                !isUserEligibleByRegion)),
        );
        btnLoadingText = 'Checking Submission..';
      }
      break;
  }

  const isNotEligibleForPro =
    isPro && !isUserPro && !isListingSponsor && buttonState === 'submit';
  const isNotEligible = isAuthenticated && isNotEligibleForPro;
  if (
    !isNotEligible &&
    isDeadlineOver(deadline, serverTime()) &&
    !isWinnersAnnounced
  ) {
    buttonText = 'Submissions in Review';
    buttonBG = 'bg-gray-500';
  } else if (
    !isNotEligible &&
    isWinnersAnnounced &&
    !['kyc', 'kyc_done', 'kyc_rejected', 'paid'].includes(buttonState)
  ) {
    buttonText = 'Winners Announced';
    buttonBG = 'bg-gray-500';
  }

  const {
    isOpen: isSurveyOpen,
    onOpen: onSurveyOpen,
    onClose: onSurveyClose,
  } = useDisclosure();

  const surveyId =
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
      ? '018c6743-c893-0000-a90e-f35d31c16692'
      : '';

  const requiresCredits =
    (isProject || isBounty) &&
    user &&
    !isEditMode &&
    !isUserSubmissionLoading &&
    !pastDeadline &&
    isAuthenticated &&
    !isPro;

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
          onSurveyOpen={onSurveyOpen}
        />
      )}
      {isSurveyOpen &&
        surveyId &&
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
          onClose={() => {
            setEasterEggOpen(false);
            setTimeout(() => setNudgeOpen(true), 150);
          }}
          isProject={isProject}
          isPro={isPro ?? false}
        />
      )}
      {isDesktop &&
        isNudgeOpen &&
        createPortal(
          <div className="fixed right-4 bottom-4 z-200 hidden sm:block">
            <div className="relative rounded-lg border border-slate-100 shadow-lg">
              <button
                type="button"
                aria-label="Dismiss"
                className="absolute top-2 right-2 inline-flex size-5 items-center justify-center rounded-full bg-slate-400 text-white shadow-md hover:bg-slate-500"
                onClick={() => setNudgeOpen(false)}
              >
                <X className="size-3" />
              </button>
              <Nudge
                setNudgeState={setNudgeOpen}
                onOpenReferral={openReferralWithEvent}
              />
            </div>
          </div>,
          document.body,
        )}
      {!isDesktop && (
        <Drawer open={isNudgeOpen} onOpenChange={setNudgeOpen}>
          <DrawerContent className="bg-slate-50">
            <div className="mx-auto w-full">
              <Nudge
                setNudgeState={setNudgeOpen}
                onOpenReferral={openReferralWithEvent}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}
      {isKYCModalOpen && submission?.id && (
        <KYCModal
          isOpen={isKYCModalOpen}
          listingId={id!}
          onClose={() => setIsKYCModalOpen(false)}
          submissionId={submission.id}
          region={region}
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
            isProject={isProject}
            isBounty={isBounty}
            isEditMode={isEditMode}
            isAuthenticated={isAuthenticated}
            isPro={isPro ?? false}
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
                    isNotEligibleForPro
                      ? 'disabled:opacity-100'
                      : 'disabled:opacity-70',
                    'text-base md:text-lg',
                    'font-semibold sm:font-semibold',
                    buttonBG,
                    isNotEligible && 'text-zinc-700',
                    isEditMode &&
                      (isPro
                        ? 'border-zinc-700 text-zinc-700 hover:text-white'
                        : 'border-brand-purple text-brand-purple hover:text-brand-purple-dark'),
                    isUserPro && isPro && 'hover:bg-black',
                    !isUserPro && isPro && 'hover:opacity-90',
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
                      {isNotEligible && <Lock className="h-4 w-4" />}
                      {isEditMode && <Pencil />}
                      <span>{buttonText}</span>
                      {requiresCredits && (
                        <CreditIcon className="-ml-2.5 size-6" />
                      )}
                    </>
                  )}
                </Button>
                {isUserPro &&
                  isPro &&
                  !isEditMode &&
                  buttonState === 'submit' && (
                    <div className="absolute top-1/2 right-4 -translate-y-1/2">
                      <ProBadge
                        containerClassName="bg-zinc-700 px-2 py-0.5 gap-1"
                        iconClassName="size-2.5 text-zinc-400"
                        textClassName="text-[10px] font-medium text-white"
                      />
                    </div>
                  )}
              </div>
            </AuthWrapper>
          </InfoWrapper>
        </div>
        {isPro && (
          <div className="mt-1 md:my-1.5 md:flex">
            <p className="mx-auto w-full rounded-md bg-gray-50 px-2 py-2 text-center text-xs text-slate-600 md:text-xs">
              {user?.isPro ? (
                `PRO listings cost 0 credits to submit :)`
              ) : (
                <>
                  You need to be a part of the <strong>PRO membership</strong>{' '}
                  to participate in this opportunity
                </>
              )}
            </p>
          </div>
        )}
        {requiresCredits && user?.isTalentFilled && (
          <div className="mt-1 md:my-1.5 md:flex">
            {creditBalance > 0 && (
              <p className="mx-auto w-full rounded-md bg-gray-50 py-2 text-center text-xs text-slate-600 md:text-xs">
                {`* Costs 1 credit to ${isProject ? 'apply' : 'submit'}`}
              </p>
            )}
            {creditBalance <= 0 && (
              <div className="w-full space-y-3">
                <p className="mx-auto w-full rounded-md py-0.5 text-center text-xs text-slate-600 md:text-xs">
                  {`* You don't have enough credits to ${isProject ? 'apply' : 'submit'}`}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-brand-purple hover:text-brand-purple h-10 w-full justify-between rounded-lg border border-gray-200 bg-white text-sm font-medium shadow hover:bg-indigo-50"
                  onClick={openReferralWithEvent}
                >
                  <div className="flex items-center gap-2">
                    <Gift className="size-7" />
                    <span>Get Free Credits</span>
                  </div>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
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
      <ReferralModal isOpen={isReferralOpen} onClose={onReferralClose} />
    </>
  );
};

'use client';

import { AlertTriangle, Loader2, Lock, Pencil } from 'lucide-react';
import { posthog } from 'posthog-js';

import { Button } from '@/components/ui/button';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useViewer } from '@/lib/viewer';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import { useChapters } from '@/features/listings/hooks/useChapters';
import {
  getLocationCooldown,
  locationCooldownTooltip,
} from '@/features/listings/utils/locationCooldown';
import {
  getRegionTooltipLabel,
  userRegionEligibilty,
} from '@/features/listings/utils/region';

import { useApplicationState } from '../hooks/useApplicationState';
import type { GrantApplicationWithTranchesAndUser } from '../queries/user-application';
import type { Grant } from '../types';
import { grantApplicationCooldownTooltip } from '../utils/grantApplicationCooldown';
import { isUserEligibleForST } from '../utils/stGrant';
import { GrantModal } from './GrantModal';
import { InfoWrapper } from './InfoWrapper';

interface GrantApplicationButtonProps {
  grant: Grant;
  // Their application to it, loaded with the page.
  application: GrantApplicationWithTranchesAndUser | null;
}

export const ApplicationActionButton = ({
  grant,
  application,
}: GrantApplicationButtonProps) => {
  const user = useViewer();
  const isAuthenticated = !!user;

  const { region, link, isNative, isPublished, isPaused, isST, sponsorId } =
    grant;
  const isUserEligibleST = isUserEligibleForST(user);

  const isUserApplicationLoading = false;
  const chapters = useChapters();

  const { buttonConfig, hasApplied, applicationState, tranches } =
    useApplicationState(application, grant);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const isUserEligibleByRegion = userRegionEligibilty({
    region,
    userLocation: user?.location ?? undefined,
    chapters,
  });

  const regionTooltipLabel = getRegionTooltipLabel(region, false, chapters);

  const locationCooldown = getLocationCooldown({
    locationUpdatedAt: user?.locationUpdatedAt ?? null,
    listingRegion: region,
    userLocation: user?.location,
    chapters,
  });
  const isLocationCooldown = locationCooldown.inCooldown;
  const isNewApplicationLocationCooldown =
    isLocationCooldown && applicationState === 'ALLOW NEW';

  const getCooldownTooltipContent = () => {
    if (isNewApplicationLocationCooldown) {
      return locationCooldownTooltip(locationCooldown.daysRemaining);
    }
    if (applicationState !== 'COOLDOWN' || !application?.decidedAt) return null;

    return grantApplicationCooldownTooltip(application.decidedAt);
  };

  const cooldownTooltipContent = getCooldownTooltipContent() || undefined;

  const isPausedForNewApplications =
    Boolean(isPaused) && applicationState === 'ALLOW NEW';

  const isGrantSponsor = user?.currentSponsorId === sponsorId;
  const isSTRestricted =
    !!isST &&
    !isUserEligibleST &&
    !isGrantSponsor &&
    applicationState === 'ALLOW NEW';
  const isNotEligibleForST = isAuthenticated && isSTRestricted;

  const isBtnDisabled =
    buttonConfig.isDisabled ||
    !isPublished ||
    isPausedForNewApplications ||
    (!!user?.id && user.isTalentFilled && !isUserEligibleByRegion) ||
    (!!user?.id && user.isTalentFilled && isNewApplicationLocationCooldown) ||
    isNotEligibleForST;

  const getButtonText = () => {
    if (isPausedForNewApplications) {
      return 'Applications Paused';
    }
    if (isNewApplicationLocationCooldown) {
      return 'Ineligible';
    }
    if (isSTRestricted && !isUserApplicationLoading) {
      if (!isAuthenticated) {
        return 'Check Eligibility';
      }
      return 'Not Eligible';
    }
    return buttonConfig.text;
  };

  const getButtonBg = () => {
    if (isPausedForNewApplications) {
      return 'bg-gray-500';
    }
    if (isNewApplicationLocationCooldown) {
      return 'bg-brand-purple-400';
    }
    if (isSTRestricted && !isUserApplicationLoading) {
      if (!isAuthenticated) {
        return 'bg-zinc-700';
      }
      return 'bg-zinc-300';
    }
    return buttonConfig.bg;
  };

  const handleSubmit = () => {
    if (link && !isNative) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      if (applicationState === 'ALLOW EDIT') {
        posthog.capture('edit_grant application');
      } else if (applicationState === 'ALLOW NEW') {
        posthog.capture('start_grant application');
      }
      onOpen();
    }
  };

  const grantCreditConditions =
    user &&
    applicationState === 'ALLOW NEW' &&
    !isUserApplicationLoading &&
    !isPaused;

  return (
    <>
      {isOpen && (
        <GrantModal
          onClose={onClose}
          isOpen={isOpen}
          grant={grant}
          editableGrantApplication={
            applicationState === 'ALLOW EDIT'
              ? (application ?? undefined)
              : undefined
          }
          application={application}
          applicationState={applicationState}
          tranches={tranches}
        />
      )}
      <div className="ph-no-capture w-full md:px-0 md:pb-3">
        <div className="flex items-center gap-2">
          <InfoWrapper
            isUserEligibleByRegion={isUserEligibleByRegion}
            regionTooltipLabel={regionTooltipLabel}
            user={user}
            cooldownTooltipContent={cooldownTooltipContent}
          >
            <AuthWrapper
              showCompleteProfileModal
              completeProfileModalBodyText={
                'Please complete your profile before applying for a grant.'
              }
              className="w-full flex-col"
            >
              <div className="relative w-full">
                <Button
                  className={cn(
                    'h-12 w-full gap-4',
                    isSTRestricted
                      ? 'disabled:opacity-100'
                      : 'disabled:opacity-70',
                    'text-base md:text-lg',
                    'font-medium',
                    grant?.link && !grant?.isNative ? 'mt-4' : '',
                    getButtonBg(),
                    'size-lg',
                    isNotEligibleForST && 'text-zinc-700',
                    applicationState === 'ALLOW EDIT' &&
                      'border-brand-purple text-brand-purple hover:text-brand-purple-dark',
                  )}
                  disabled={isBtnDisabled}
                  onClick={handleSubmit}
                  variant={
                    applicationState === 'ALLOW EDIT' ? 'outline' : 'default'
                  }
                >
                  {isUserApplicationLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>{buttonConfig.loadingText}</span>
                    </>
                  ) : (
                    <>
                      {isNotEligibleForST && <Lock className="h-4 w-4" />}
                      {applicationState === 'ALLOW EDIT' && <Pencil />}
                      <span>{getButtonText()}</span>
                    </>
                  )}
                </Button>
              </div>
            </AuthWrapper>
          </InfoWrapper>
        </div>
        {hasApplied && (
          <div className="flex w-full gap-2 bg-[#62F6FF10] p-2 md:mb-4 md:p-3">
            <AlertTriangle className="text-[#1A7F86]" />
            <p className="text-left text-xs font-medium text-[#1A7F86]">
              You will be notified via email if your grant has been approved or
              rejected.
            </p>
          </div>
        )}
        {isST && !isUserEligibleST && (
          <div className="mt-1 md:my-1.5 md:flex">
            <p className="mx-auto w-full rounded-md bg-gray-50 px-2 py-2 text-center text-xs text-slate-600 md:text-xs">
              You need to be a <strong>Superteam member</strong> to be able to
              apply for this grant
            </p>
          </div>
        )}
        {grantCreditConditions && (
          <div className="mt-1 md:my-1.5 md:flex">
            <p className="mx-auto w-full rounded-md bg-[#62F6FF10] py-0.5 text-center text-xs font-medium text-[#1A7F86] md:text-xs">
              Grant applications do not require credits
            </p>
          </div>
        )}
      </div>
    </>
  );
};

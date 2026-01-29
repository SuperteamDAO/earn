import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Lock, Pencil } from 'lucide-react';
import posthog from 'posthog-js';

import { Button } from '@/components/ui/button';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import {
  getRegionTooltipLabel,
  userRegionEligibilty,
} from '@/features/listings/utils/region';
import { ProBadge } from '@/features/pro/components/ProBadge';

import { useApplicationState } from '../hooks/useApplicationState';
import { userApplicationQuery } from '../queries/user-application';
import { type Grant } from '../types';
import { isUserEligibleForST } from '../utils/stGrant';
import { GrantModal } from './GrantModal';
import { InfoWrapper } from './InfoWrapper';

interface GrantApplicationButtonProps {
  grant: Grant;
}

export const ApplicationActionButton = ({
  grant,
}: GrantApplicationButtonProps) => {
  const { user } = useUser();
  const { authenticated } = usePrivy();
  const isAuthenticated = authenticated;

  const { region, id, link, isNative, isPublished, isPro, isST, sponsorId } =
    grant;
  const isUserPro = user?.isPro;
  const isUserEligibleST = isUserEligibleForST(user);

  const { data: application, isLoading: isUserApplicationLoading } = useQuery({
    ...userApplicationQuery(id),
    enabled: !!user?.id,
  });

  const { buttonConfig, hasApplied, applicationState, tranches } =
    useApplicationState(application, grant);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const isUserEligibleByRegion = userRegionEligibilty({
    region,
    userLocation: user?.location,
  });

  const regionTooltipLabel = getRegionTooltipLabel(region);

  const getCooldownTooltipContent = () => {
    if (applicationState !== 'COOLDOWN' || !application?.decidedAt) return null;

    return `You must wait 30 days from the decision date of your last application before reapplying for this grant.`;
  };

  const cooldownTooltipContent = getCooldownTooltipContent() || undefined;

  const isGrantSponsor = user?.currentSponsorId === sponsorId;
  const isProRestricted = isST
    ? !isUserEligibleST && !isGrantSponsor && applicationState === 'ALLOW NEW'
    : isPro &&
      !isUserPro &&
      !isGrantSponsor &&
      applicationState === 'ALLOW NEW';
  const isNotEligibleForPro = isAuthenticated && isProRestricted;

  const isBtnDisabled =
    buttonConfig.isDisabled ||
    Boolean(
      !isPublished ||
        (user?.id && user?.isTalentFilled && !isUserEligibleByRegion) ||
        isNotEligibleForPro,
    );

  const getButtonText = () => {
    if (isProRestricted && !isUserApplicationLoading) {
      if (!isAuthenticated) {
        return 'Check Eligibility';
      }
      return 'Not Eligible';
    }
    return buttonConfig.text;
  };

  const getButtonBg = () => {
    if (isProRestricted && !isUserApplicationLoading) {
      if (!isAuthenticated) {
        return 'bg-zinc-700';
      }
      return 'bg-zinc-300';
    }
    if (isUserPro && isPro && applicationState === 'ALLOW NEW') {
      return 'bg-zinc-800';
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
    user && applicationState === 'ALLOW NEW' && !isUserApplicationLoading;

  return (
    <>
      {isOpen && (
        <GrantModal
          onClose={onClose}
          isOpen={isOpen}
          grant={grant}
          editableGrantApplication={
            applicationState === 'ALLOW EDIT' ? application : undefined
          }
          applicationId={application?.id}
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
                    isProRestricted
                      ? 'disabled:opacity-100'
                      : 'disabled:opacity-70',
                    'text-base md:text-lg',
                    'font-medium',
                    grant?.link && !grant?.isNative ? 'mt-4' : '',
                    getButtonBg(),
                    'size-lg',
                    isNotEligibleForPro && 'text-zinc-700',
                    applicationState === 'ALLOW EDIT' &&
                      (isPro
                        ? 'border-zinc-700 text-zinc-700 hover:bg-zinc-100'
                        : 'border-brand-purple text-brand-purple hover:text-brand-purple-dark'),
                    isUserPro && isPro && 'hover:bg-black',
                    !isUserPro && isPro && 'hover:opacity-90',
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
                      {isNotEligibleForPro && <Lock className="h-4 w-4" />}
                      {applicationState === 'ALLOW EDIT' && <Pencil />}
                      <span>{getButtonText()}</span>
                    </>
                  )}
                </Button>
                {!isST &&
                  isUserPro &&
                  isPro &&
                  applicationState === 'ALLOW NEW' &&
                  !isUserApplicationLoading && (
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
        {hasApplied && (
          <div className="flex w-full gap-2 bg-[#62F6FF10] p-2 md:mb-4 md:p-3">
            <AlertTriangle className="text-[#1A7F86]" />
            <p className="text-left text-xs font-medium text-[#1A7F86]">
              You will be notified via email if your grant has been approved or
              rejected.
            </p>
          </div>
        )}
        {(isPro || isST) && (isST ? !isUserEligibleST : !isUserPro) && (
          <div className="mt-1 md:my-1.5 md:flex">
            <p className="mx-auto w-full rounded-md bg-gray-50 px-2 py-2 text-center text-xs text-slate-600 md:text-xs">
              {isST ? (
                <>
                  You need to be a <strong>Superteam member</strong> to be able
                  to apply for this grant
                </>
              ) : (
                <>
                  You need to be a part of the <strong>PRO membership</strong>{' '}
                  to apply for this grant
                </>
              )}
            </p>
          </div>
        )}
        {grantCreditConditions && !isPro && (
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

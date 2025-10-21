import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Pencil } from 'lucide-react';
import posthog from 'posthog-js';
import React from 'react';

import { Button } from '@/components/ui/button';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import { isGrantPausedForNewApplications } from '@/features/grants/utils/pause-applications';
import {
  getRegionTooltipLabel,
  userRegionEligibilty,
} from '@/features/listings/utils/region';

import { useApplicationState } from '../hooks/useApplicationState';
import { userApplicationQuery } from '../queries/user-application';
import { type Grant } from '../types';
import { GrantModal } from './GrantModal';
import { InfoWrapper } from './InfoWrapper';

interface GrantApplicationButtonProps {
  grant: Grant;
}

export const ApplicationActionButton = ({
  grant,
}: GrantApplicationButtonProps) => {
  const { user } = useUser();

  const { region, id, link, isNative, isPublished } = grant;

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

  const isPausedForNew = isGrantPausedForNewApplications(grant);
  const pausedForThisState = applicationState === 'ALLOW NEW' && isPausedForNew;
  const pausedTooltipContent = pausedForThisState
    ? 'New grant applications have been temporarily paused'
    : undefined;

  const isBtnDisabled =
    buttonConfig.isDisabled ||
    Boolean(
      !isPublished ||
        (user?.id && user?.isTalentFilled && !isUserEligibleByRegion) ||
        pausedForThisState,
    );

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
            pausedTooltipContent={pausedTooltipContent}
          >
            <AuthWrapper
              showCompleteProfileModal
              completeProfileModalBodyText={
                'Please complete your profile before applying for a grant.'
              }
              className="w-full flex-col"
            >
              <Button
                className={cn(
                  'h-12 w-full gap-4',
                  'disabled:opacity-70',
                  'text-base md:text-lg',
                  'font-medium',
                  grant?.link && !grant?.isNative ? 'mt-4' : '',
                  buttonConfig.bg,
                  'size-lg',
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
                    {applicationState === 'ALLOW EDIT' && <Pencil />}
                    <span>{buttonConfig.text}</span>
                  </>
                )}
              </Button>
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

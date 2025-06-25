import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Pencil } from 'lucide-react';
import posthog from 'posthog-js';
import React from 'react';

import { Button } from '@/components/ui/button';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
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

  const isBtnDisabled =
    buttonConfig.isDisabled ||
    Boolean(
      !isPublished ||
        (user?.id && user?.isTalentFilled && !isUserEligibleByRegion),
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
      <div className="ph-no-capture fixed bottom-0 left-1/2 z-50 mb-1 w-full -translate-x-1/2 border-t-1 border-slate-100 bg-white px-3 py-4 pt-2 pb-14 md:static md:translate-x-0 md:border-t-0 md:border-transparent md:px-0 md:py-0 md:pb-5">
        <div className="flex items-center gap-2">
          <InfoWrapper
            isUserEligibleByRegion={isUserEligibleByRegion}
            regionTooltipLabel={regionTooltipLabel}
            user={user}
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
                  'font-semibold sm:font-medium',
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

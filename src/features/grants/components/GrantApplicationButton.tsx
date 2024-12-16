import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
import React from 'react';
import { LuPencil } from 'react-icons/lu';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip } from '@/components/ui/tooltip';
import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import {
  getRegionTooltipLabel,
  userRegionEligibilty,
} from '@/features/listings/utils/region';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { userApplicationQuery } from '../queries/user-application';
import { type Grant } from '../types';
import { GrantApplicationModal } from './GrantApplicationModal';

interface GrantApplicationButtonProps {
  grant: Grant;
}

const InfoWrapper = ({
  children,
  isUserEligibleByRegion,
  regionTooltipLabel,
  user,
}: {
  children: React.ReactNode;
  isUserEligibleByRegion: boolean;
  regionTooltipLabel: string;
  user: any;
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        {!isUserEligibleByRegion && (
          <PopoverContent className="w-80 p-4">
            <p className="text-sm text-gray-700">{regionTooltipLabel}</p>
          </PopoverContent>
        )}
      </Popover>
    );
  }

  return (
    <Tooltip
      content={!isUserEligibleByRegion ? regionTooltipLabel : null}
      contentProps={{ className: 'rounded-md' }}
      disabled={!user?.id || !user?.isTalentFilled || isUserEligibleByRegion}
    >
      {children}
    </Tooltip>
  );
};

export const GrantApplicationButton = ({
  grant,
}: GrantApplicationButtonProps) => {
  const { user } = useUser();
  const { region, id, link, isNative } = grant;

  const isUserEligibleByRegion = userRegionEligibilty({
    region,
    userLocation: user?.location,
  });

  const { data: application, isLoading: isUserApplicationLoading } = useQuery({
    ...userApplicationQuery(id),
    enabled: !!user?.id,
  });

  let applicationState: 'APPLIED' | 'ALLOW NEW' | 'ALLOW EDIT' = 'ALLOW NEW';
  if (
    application?.applicationStatus === 'Pending' ||
    application?.applicationStatus === 'Approved'
  ) {
    applicationState = 'APPLIED';
    if (application?.applicationStatus === 'Pending') {
      if (grant.isNative) {
        applicationState = 'ALLOW EDIT';
      }
    }
  }

  const hasApplied =
    applicationState === 'APPLIED' || applicationState === 'ALLOW EDIT';

  let buttonText;
  let buttonBG;
  let isBtnDisabled;
  let btnLoadingText;

  switch (applicationState) {
    case 'APPLIED':
      buttonText = 'Applied Successfully';
      buttonBG = 'bg-green-600';
      isBtnDisabled = true;
      btnLoadingText = null;
      break;

    case 'ALLOW EDIT':
      buttonText = 'Edit Application';
      isBtnDisabled = Boolean(
        user?.id && user?.isTalentFilled && !isUserEligibleByRegion,
      );
      btnLoadingText = 'Checking Application..';
      break;

    default:
      buttonText = 'Apply Now';
      buttonBG = 'bg-brand-purple';
      isBtnDisabled = Boolean(
        !grant.isPublished ||
          (user?.id && user?.isTalentFilled && !isUserEligibleByRegion),
      );
      btnLoadingText = 'Checking Application..';
      break;
  }

  const { isOpen, onOpen, onClose } = useDisclosure();

  const regionTooltipLabel = getRegionTooltipLabel(region);

  const handleSubmit = () => {
    if (link && !isNative) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      onOpen();
    }
  };

  return (
    <>
      {isOpen && (
        <GrantApplicationModal
          onClose={onClose}
          isOpen={isOpen}
          grant={grant}
          grantApplication={
            applicationState === 'ALLOW EDIT' ? application : undefined
          }
        />
      )}
      <InfoWrapper
        isUserEligibleByRegion={isUserEligibleByRegion}
        regionTooltipLabel={regionTooltipLabel}
        user={user}
      >
        <div className="ph-no-capture fixed bottom-0 left-1/2 z-50 flex w-full -translate-x-1/2 bg-white px-3 py-4 md:static md:translate-x-0 md:px-0 md:py-0">
          <AuthWrapper
            showCompleteProfileModal
            completeProfileModalBodyText={
              'Please complete your profile before applying for a grant.'
            }
            className="w-full flex-col"
          >
            <Button
              className={cn(
                'h-12 w-full gap-4 text-lg',
                grant?.link && !grant?.isNative ? 'mt-4' : '',
                'mb-12 lg:mb-5',
                'disabled:opacity-70',
                buttonBG,
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
                  {btnLoadingText}
                </>
              ) : (
                <>
                  {applicationState === 'ALLOW EDIT' && <LuPencil />}
                  {buttonText}
                </>
              )}
            </Button>
          </AuthWrapper>
        </div>
      </InfoWrapper>
      {hasApplied && (
        <div className="mb-4 flex w-full gap-2 bg-[#62F6FF10] p-3">
          <AlertTriangle className="text-[#1A7F86]" />
          <p className="text-xs font-medium text-[#1A7F86]">
            You will be notified via email if your grant has been approved or
            rejected.
          </p>
        </div>
      )}
    </>
  );
};

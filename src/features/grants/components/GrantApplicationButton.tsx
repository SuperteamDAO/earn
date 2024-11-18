import { WarningIcon } from '@chakra-ui/icons';
import { Button, Flex, Text, Tooltip } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { LuPencil } from 'react-icons/lu';

import { AuthWrapper } from '@/features/auth';
import {
  getRegionTooltipLabel,
  userRegionEligibilty,
} from '@/features/listings';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useUser } from '@/store/user';

import { userApplicationQuery } from '../queries';
import { type Grant } from '../types';
import { GrantApplicationModal } from './GrantApplicationModal';

interface GrantApplicationButtonProps {
  grant: Grant;
}

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
      buttonBG = 'green.500';
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
      buttonBG = 'brand.purple';
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
      <Tooltip
        bg="brand.slate.500"
        hasArrow
        isDisabled={
          !user?.id || !user?.isTalentFilled || isUserEligibleByRegion
        }
        label={!isUserEligibleByRegion ? regionTooltipLabel : ''}
        rounded="md"
      >
        <Flex
          className="ph-no-capture"
          pos={{ base: 'fixed', md: 'static' }}
          zIndex={999}
          bottom={0}
          left="50%"
          w="full"
          px={{ base: 3, md: 0 }}
          py={{ base: 4, md: 0 }}
          bg="white"
          transform={{ base: 'translateX(-50%)', md: 'none' }}
        >
          <AuthWrapper
            showCompleteProfileModal
            completeProfileModalBodyText={
              'Please complete your profile before applying for a grant.'
            }
            className="w-full flex-col"
          >
            <Button
              gap={4}
              w={'full'}
              mt={grant?.link && !grant?.isNative ? 4 : 0}
              mb={{ base: 12, md: 5 }}
              bg={buttonBG}
              _hover={{ bg: buttonBG }}
              _disabled={{
                opacity: { base: '96%', md: '70%' },
              }}
              isDisabled={isBtnDisabled}
              isLoading={isUserApplicationLoading}
              loadingText={btnLoadingText}
              onClick={handleSubmit}
              size="lg"
              variant={applicationState === 'ALLOW EDIT' ? 'outline' : 'solid'}
            >
              {applicationState === 'ALLOW EDIT' && <LuPencil />}
              {buttonText}
            </Button>
          </AuthWrapper>
        </Flex>
      </Tooltip>
      {hasApplied && (
        <Flex gap="2" w="full" mb={4} p="3" bg={'#62F6FF10'}>
          <WarningIcon color="#1A7F86" />
          <Text color="#1A7F86" fontSize={'xs'} fontWeight={500}>
            You will be notified via email if your grant has been approved or
            rejected.
          </Text>
        </Flex>
      )}
    </>
  );
};

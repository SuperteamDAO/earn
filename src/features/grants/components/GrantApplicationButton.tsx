import { WarningIcon } from '@chakra-ui/icons';
import { Button, Flex, Text, Tooltip, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import React from 'react';

import { AuthWrapper } from '@/features/auth';
import {
  getRegionTooltipLabel,
  userRegionEligibilty,
  WarningModal,
} from '@/features/listings';
import { useUser } from '@/store/user';

import { userApplicationStatusQuery } from '../queries/user-application-status';
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

  const { status: authStatus } = useSession();
  const isAuthenticated = authStatus === 'authenticated';

  const isUserEligibleByRegion = userRegionEligibilty(region, user?.location);

  const { data: applicationStatus, isLoading: isUserApplicationLoading } =
    useQuery({ ...userApplicationStatusQuery(id), enabled: !!user?.id });

  const hasApplied = applicationStatus?.hasPendingApplication;

  let buttonText;
  let buttonBG;
  let isBtnDisabled;
  let btnLoadingText;

  switch (hasApplied) {
    case true:
      buttonText = 'Applied Successfully';
      buttonBG = 'green.500';
      isBtnDisabled = true;
      btnLoadingText = null;
      break;

    default:
      buttonText = 'Apply Now';
      buttonBG = 'brand.purple';
      isBtnDisabled = Boolean(
        user?.id && user?.isTalentFilled && !isUserEligibleByRegion,
      );
      btnLoadingText = 'Checking Application..';
  }

  const {
    isOpen: warningIsOpen,
    onOpen: warningOnOpen,
    onClose: warningOnClose,
  } = useDisclosure();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const regionTooltipLabel = getRegionTooltipLabel(region);

  const handleSubmit = () => {
    if (isAuthenticated) {
      if (!user?.isTalentFilled) {
        warningOnOpen();
      } else if (link && !isNative) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        onOpen();
      }
    }
  };

  return (
    <>
      {isOpen && (
        <GrantApplicationModal
          onClose={onClose}
          isOpen={isOpen}
          grant={grant}
        />
      )}
      {warningIsOpen && (
        <WarningModal
          isOpen={warningIsOpen}
          onClose={warningOnClose}
          title={'Complete your profile'}
          bodyText={
            'Please complete your profile before submitting to a bounty.'
          }
          primaryCtaText={'Complete Profile'}
          primaryCtaLink={'/new/talent'}
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
          <AuthWrapper style={{ w: 'full', direction: 'column' }}>
            <Button
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
              variant="solid"
            >
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

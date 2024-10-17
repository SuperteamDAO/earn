import { WarningIcon } from '@chakra-ui/icons';
import { Button, Flex, Text, Tooltip, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { AuthWrapper } from '@/features/auth';
import {
  getRegionTooltipLabel,
  userRegionEligibilty,
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
  const { t } = useTranslation('common');

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
      buttonText = t('grantApplicationButton.appliedSuccessfully');
      buttonBG = 'green.500';
      isBtnDisabled = true;
      btnLoadingText = null;
      break;

    default:
      buttonText = t('grantApplicationButton.applyNow');
      buttonBG = 'brand.purple';
      isBtnDisabled = Boolean(
        user?.id && user?.isTalentFilled && !isUserEligibleByRegion,
      );
      btnLoadingText = t('grantApplicationButton.checkingApplication');
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
            completeProfileModalBodyText={t(
              'grantApplicationButton.completeProfileBeforeApplying',
            )}
            style={{ w: 'full', direction: 'column' }}
          >
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
            {t('grantApplicationButton.applicationNotification')}
          </Text>
        </Flex>
      )}
    </>
  );
};

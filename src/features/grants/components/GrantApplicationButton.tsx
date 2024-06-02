import { Button, Flex, Tooltip, useDisclosure } from '@chakra-ui/react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import React, { useEffect, useState } from 'react';

import { AuthWrapper } from '@/features/auth';
import {
  getRegionTooltipLabel,
  userRegionEligibilty,
  WarningModal,
} from '@/features/listings';
import { userStore } from '@/store/user';

import { type Grant } from '../types';
import { GrantApplicationModal } from './GrantApplicationModal';

interface GrantApplicationButtonProps {
  grant: Grant;
}

export const GrantApplicationButton = ({
  grant,
}: GrantApplicationButtonProps) => {
  const { userInfo } = userStore();
  const [hasApplied, setHasApplied] = useState(false);
  const [isUserApplicationLoading, setIsUserApplicationLoading] =
    useState(false);

  const { region, id } = grant;

  const { status: authStatus } = useSession();
  const isAuthenticated = authStatus === 'authenticated';

  const isUserEligibleByRegion = userRegionEligibilty(
    region,
    userInfo?.location,
  );

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
        userInfo?.id && userInfo?.isTalentFilled && !isUserEligibleByRegion,
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
      if (!userInfo?.isTalentFilled) {
        warningOnOpen();
      } else {
        onOpen();
      }
    }
  };

  const getUserApplication = async () => {
    setIsUserApplicationLoading(true);
    try {
      const applicationDetails = await axios.get(`/api/grantApplication/user`, {
        params: { grantId: id },
      });
      setHasApplied(!!applicationDetails?.data?.id);
      setIsUserApplicationLoading(false);
    } catch (e) {
      setIsUserApplicationLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfo?.id) return;
    getUserApplication();
  }, [userInfo?.id]);

  return (
    <>
      {isOpen && (
        <GrantApplicationModal
          onClose={onClose}
          isOpen={isOpen}
          setHasApplied={setHasApplied}
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
          !userInfo?.id || !userInfo?.isTalentFilled || isUserEligibleByRegion
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
          <AuthWrapper style={{ w: 'full' }}>
            <Button
              w={'full'}
              mb={{ base: 0, md: 5 }}
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
    </>
  );
};

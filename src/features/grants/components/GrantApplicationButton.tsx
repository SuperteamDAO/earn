import { Button, Flex, Tooltip } from '@chakra-ui/react';
import React from 'react';

import { AuthWrapper } from '@/features/auth';
import {
  getRegionTooltipLabel,
  userRegionEligibilty,
} from '@/features/listings';
import { userStore } from '@/store/user';

import { type Grant } from '../types';

export const GrantApplicationButton = ({ grant }: { grant: Grant }) => {
  const { userInfo } = userStore();

  const { region } = grant;

  const isUserEligibleByRegion = userRegionEligibilty(
    region,
    userInfo?.location,
  );
  const regionTooltipLabel = getRegionTooltipLabel(region);

  return (
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
            bg={'brand.purple'}
            _hover={{ bg: 'brand.purple' }}
            _disabled={{
              opacity: { base: '96%', md: '70%' },
            }}
            // isDisabled={isBtnDisabled}
            // isLoading={isUserSubmissionLoading}
            // loadingText={btnLoadingText}
            // onClick={handleSubmit}
            size="lg"
            variant="solid"
          >
            Apply Now
          </Button>
        </AuthWrapper>
      </Flex>
    </Tooltip>
  );
};

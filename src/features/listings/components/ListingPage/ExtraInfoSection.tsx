import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Box, HStack, Link, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { usePostHog } from 'posthog-js/react';

import { type ParentSkills } from '@/interface/skills';
import { getURLSanitized } from '@/utils/getURLSanitized';

import type { ListingHackathon } from '../../types';

interface ExtraInfoSectionProps {
  skills?: ParentSkills[];
  requirements?: string | undefined;
  pocSocials?: string | undefined;
  region?: string | undefined;
  Hackathon?: ListingHackathon;
  isGrant?: boolean;
}
export function ExtraInfoSection({
  skills,
  Hackathon,
  requirements,
  pocSocials,
  region,
  isGrant = false,
}: ExtraInfoSectionProps) {
  const posthog = usePostHog();
  const { t } = useTranslation('common');

  return (
    <VStack gap={8} w={{ base: 'full', md: '22rem' }} pt={2}>
      {region && region !== 'GLOBAL' && (
        <VStack align={'start'} w="full" fontSize={'sm'}>
          <Text color={'brand.slate.600'} fontWeight={600}>
            {t('ExtraInfoSection.regionalListing', {
              type: isGrant ? t('common:grants') : t('common:freelanceGigs'),
            })}
          </Text>
          <Text h="100%" color={'brand.slate.500'}>
            <>
              {t('ExtraInfoSection.listingOpenFor', {
                type: isGrant ? t('common:grants') : t('common:freelanceGigs'),
              })}
              <Text fontWeight={600}>{region}</Text>
            </>
          </Text>
        </VStack>
      )}
      {Hackathon && (
        <VStack align={'start'} w="full" fontSize="sm">
          <Text color={'brand.slate.600'} fontWeight={600}>
            {t('ExtraInfoSection.hackathonTrack', {
              name: Hackathon.name?.toUpperCase(),
            })}
          </Text>
          <Text color={'brand.slate.500'}>{Hackathon.description}</Text>
          <Link
            color={'brand.slate.500'}
            fontWeight={500}
            href={`/hackathon/${Hackathon.name?.toLowerCase()}`}
            isExternal
          >
            {t('ExtraInfoSection.viewAllChallenges')}
            <ExternalLinkIcon color={'#64768b'} mb={1} as="span" mx={1} />
          </Link>
        </VStack>
      )}
      {requirements && (
        <VStack align={'start'} w={'full'} fontSize="sm">
          <Text h="100%" color={'brand.slate.600'} fontWeight={600}>
            {t('ExtraInfoSection.eligibility')}
          </Text>
          <Text color={'brand.slate.500'}>{requirements}</Text>
        </VStack>
      )}
      <VStack align={'start'} display={{ base: 'none', md: 'flex' }} w="full">
        <Text
          h="100%"
          color={'brand.slate.600'}
          fontSize={'sm'}
          fontWeight={600}
          textAlign="center"
        >
          {t('ExtraInfoSection.skillsNeeded')}
        </Text>
        <HStack flexWrap={'wrap'} gap={3}>
          {skills?.map((skill) => (
            <Box
              key={skill}
              m={'0px !important'}
              px={4}
              py={1}
              color="#475569"
              fontSize="sm"
              fontWeight={500}
              bg={'#F1F5F9'}
              rounded={'sm'}
            >
              <Text fontSize={'xs'}>{skill}</Text>
            </Box>
          ))}
        </HStack>
      </VStack>
      {pocSocials && (
        <VStack
          align={'start'}
          display={{ base: 'none', md: 'flex' }}
          w={'full'}
          fontSize="sm"
        >
          <Text
            h="100%"
            color={'brand.slate.600'}
            fontWeight={600}
            textAlign="center"
          >
            {t('ExtraInfoSection.contact')}
          </Text>
          <Text>
            <Link
              className="ph-no-capture"
              color={'#64768b'}
              fontWeight={500}
              href={getURLSanitized(pocSocials)}
              isExternal
              onClick={() => posthog.capture('reach out_listing')}
            >
              {t('ExtraInfoSection.reachOut')}
              <ExternalLinkIcon color={'#64768b'} mb={1} as="span" mx={1} />
            </Link>
            <Text as="span" color={'brand.slate.500'}>
              {t('ExtraInfoSection.questionsAboutListing')}
            </Text>
          </Text>
        </VStack>
      )}
    </VStack>
  );
}

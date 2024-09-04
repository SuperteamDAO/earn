import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Box, HStack, Link, Text, VStack } from '@chakra-ui/react';
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
  return (
    <VStack gap={8} w={{ base: 'full', md: '22rem' }} pt={2}>
      {region && region !== 'GLOBAL' && (
        <VStack align={'start'} w="full" fontSize={'sm'}>
          <Text color={'brand.slate.600'} fontWeight={600}>
            REGIONAL {isGrant ? 'GRANT' : 'LISTING'}
          </Text>
          <Text h="100%" color={'brand.slate.500'}>
            <>
              This {isGrant ? 'grant' : 'listing'} is only open for people in{' '}
              <Text fontWeight={600}>{region}</Text>
            </>
          </Text>
        </VStack>
      )}
      {Hackathon && (
        <VStack align={'start'} w="full" fontSize="sm">
          <Text color={'brand.slate.600'} fontWeight={600}>
            {Hackathon.name?.toUpperCase()} TRACK
          </Text>
          <Text color={'brand.slate.500'}>{Hackathon.description}</Text>
          <Link
            color={'brand.slate.500'}
            fontWeight={500}
            href={`/hackathon/${Hackathon.name?.toLowerCase()}`}
            isExternal
          >
            View All Challenges
            <ExternalLinkIcon color={'#64768b'} mb={1} as="span" mx={1} />
          </Link>
        </VStack>
      )}
      {requirements && (
        <VStack align={'start'} w={'full'} fontSize="sm">
          <Text h="100%" color={'brand.slate.600'} fontWeight={600}>
            ELIGIBILITY
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
          SKILLS NEEDED
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
            CONTACT
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
              Reach out
              <ExternalLinkIcon color={'#64768b'} mb={1} as="span" mx={1} />
            </Link>
            <Text as="span" color={'brand.slate.500'}>
              if you have any questions about this listing
            </Text>
          </Text>
        </VStack>
      )}
    </VStack>
  );
}

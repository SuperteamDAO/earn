import { Divider, HStack, Text, VStack } from '@chakra-ui/react';
import { type StaticImageData } from 'next/image';

import { HighQualityImage } from './HighQualityImage';

type ListingType = 'development' | 'content' | 'community' | 'design';

type Skills =
  | 'frontend'
  | 'backend'
  | 'writing'
  | 'marketing'
  | 'community'
  | 'design';
const skillColors: Record<Skills, { foreground: string; background: string }> =
  {
    frontend: {
      foreground: '#0D3D99',
      background: '#990D8B0A',
    },
    backend: {
      foreground: '#2384F5',
      background: '#2384F50A',
    },
    writing: {
      foreground: '#0D3D99',
      background: '#0D3D990A',
    },
    marketing: {
      foreground: '#F56F23',
      background: '#F56F230A',
    },
    community: {
      foreground: '#838281',
      background: '#8382810A',
    },
    design: {
      foreground: '#FF0000',
      background: '#FF00000A',
    },
  };

export interface ListingCardProps {
  pfp: StaticImageData;
  title: string;
  name: string;
  description: string;
  skills: Skills[];
  submissionCount: number;
  token: string;
  tokenIcon: StaticImageData;
  amount: string;
  type: ListingType;
}

export function ListingCard({
  pfp,
  title,
  name,
  description,
  skills,
  submissionCount,
  token,
  tokenIcon,
  amount,
}: ListingCardProps) {
  return (
    <VStack
      w="21.5rem"
      h="18.75rem"
      bg="white"
      border="1px solid"
      borderColor="brand.slate.200"
      shadow={'0px 4px 6px 0px rgba(226, 232, 240, 0.41)'}
      rounded={6}
    >
      <VStack align="start" gap={4} h="full" p={4} pb={3}>
        <HStack gap={4} w="100%">
          <HighQualityImage alt="Pied Piper Logo" width={49} src={pfp} />
          <VStack align="start" flexGrow={1} gap={0} w="100%" fontSize={'sm'}>
            <Text color="brand.slate.700" fontWeight={600}>
              {title}
            </Text>
            <Text color="brand.slate.400" fontWeight={600} bg="brand.slate.50">
              By {name}
            </Text>
          </VStack>
        </HStack>
        <Text
          color="brand.slate.500"
          fontSize="sm"
          fontWeight={500}
          noOfLines={4}
        >
          {description}
        </Text>
        <HStack justify="space-between" w="full" mt="auto" fontSize="x-small">
          <Text color="brand.slate.400" fontWeight={500}>
            Skills
          </Text>
          <HStack>
            {skills.map((s) => (
              <Text
                key={s}
                px={2}
                py={1}
                color={skillColors[s].foreground}
                fontWeight={500}
                textTransform={'capitalize'}
                bg={skillColors[s].background}
                rounded={6}
              >
                {s}
              </Text>
            ))}
          </HStack>
        </HStack>
      </VStack>
      <Divider />
      <HStack justify={'space-between'} w="full" px={4} pt={2} pb={4}>
        <HStack>
          <HighQualityImage
            height={18}
            width={18}
            src={tokenIcon}
            alt={`${token} icon`}
          />
          <Text color="brand.slate.800" fontWeight={600}>
            {amount}
          </Text>
        </HStack>
        <HStack>
          <Text color="brand.slate.800" fontWeight={600}>
            {submissionCount}
          </Text>
          <Text color="brand.slate.500" fontWeight={600}>
            Submissions
          </Text>
        </HStack>
      </HStack>
    </VStack>
  );
}

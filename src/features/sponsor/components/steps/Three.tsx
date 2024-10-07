import { HStack, Text, VStack } from '@chakra-ui/react';

import { HighQualityImage } from '../HighQualityImage';

const submissions = [
  {
    avatar: '/assets/landingsponsor/users/jake.webp',
    title: 'Jake’s Submission',
    subtitle: 'jake.substack.com/why-piper-coin...',
  },
  {
    avatar: '/assets/landingsponsor/users/keith.webp',
    title: 'Keith’s Submission',
    subtitle: 'keith.substack.com/why-piper-coin...',
  },
  {
    avatar: '/assets/landingsponsor/users/mike.webp',
    title: 'Mike’s Submission',
    subtitle: 'mike.substack.com/why-piper-coin...',
  },
];

interface ProfileProps {
  submissions: (typeof submissions)[0];
}

function Profile({ submissions }: ProfileProps) {
  return (
    <HStack
      w="full"
      px={4}
      py={4}
      bg="white"
      border="1px solid"
      borderColor="brand.slate.200"
      shadow={'0px 4px 6px 0px rgba(226, 232, 240, 0.41)'}
      rounded={6}
    >
      <HighQualityImage
        src={submissions.avatar}
        alt={submissions.title}
        width={40}
        height={40}
      />
      <VStack align="start" gap={0}>
        <Text fontSize="sm" fontWeight={500}>
          {submissions.title}
        </Text>
        <Text color="brand.slate.500" fontSize="sm" fontWeight={500}>
          {submissions.subtitle}
        </Text>
      </VStack>
    </HStack>
  );
}

export function StepThree() {
  return (
    <VStack justify={'space-between'} w="21.5rem" h="18.75rem">
      {submissions.map((submission, index) => (
        <Profile key={index} submissions={submission} />
      ))}
    </VStack>
  );
}

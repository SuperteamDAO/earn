import {
  AbsoluteCenter,
  Box,
  Center,
  Grid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { usePostHog } from 'posthog-js/react';

import { fontSize, maxW2, padding } from '../utils';
import { HighQualityImage } from './HighQualityImage';

interface FeatureProps {
  icon: string;
  title: string;
  description: string;
}

const features: FeatureProps[] = [
  {
    icon: '/landingsponsor/icons/Doc.svg',
    title: '< 1 Min to Publish a Listing',
    description:
      'Never start from scratch. No hassle of writing your own descriptions: either duplicate an existing bounty, or choose from 10+ templates.',
  },
  {
    icon: '/landingsponsor/icons/Review.svg',
    title: 'Review & Sort',
    description:
      'Reviewing submissions is no longer a pain. Effortlessly categorize submissions with our intuitive labelling system. ',
  },
  {
    icon: '/icons/green-dollar.svg',
    title: 'Easy Payments',
    description:
      'Pay talent directly from the platform without worrying about sending payment to the wrong address.',
  },
  {
    icon: '/landingsponsor/icons/Skill.svg',
    title: 'Skill Based Targetting',
    description:
      'Each new listing gets sent to relevant people via e-mail and Discord.',
  },
  {
    icon: '/landingsponsor/icons/Enter.svg',
    title: 'Get Quotes',
    description:
      'Not sure how to budget your freelance gig? Opt to receive quotes from participants instead.',
  },
  {
    icon: '/landingsponsor/icons/Invite.svg',
    title: 'Invite & Collaborate',
    description:
      'Invite multiple team members via email, and collaborate on managing your listings.',
  },
];

interface Props {
  showVideo: () => void;
}

export function Features({ showVideo }: Props) {
  const posthog = usePostHog();

  return (
    <VStack pos="relative" w="full" my="8rem" px={padding} id="features">
      <Box
        pos="absolute"
        top={0}
        w="full"
        h={{ base: '17.8rem', md: '36.96rem' }}
        bg="brand.purple"
      />
      <VStack pos="relative" maxW={maxW2} px={padding} py={'3rem'}>
        <Text
          maxW="48rem"
          color="white"
          fontSize={{ base: '1rem', md: '1.6rem' }}
          fontWeight={600}
          textAlign="center"
          opacity={0.76}
        >
          YOUR DASHBOARD
        </Text>
        <Text
          maxW="48rem"
          color="white"
          fontSize={fontSize}
          fontWeight={600}
          lineHeight={1.1}
          textAlign="center"
        >
          A seamless way to manage all your listings in one place
        </Text>
      </VStack>
      <Center
        className="ph-no-capture"
        pos="relative"
        w="full"
        maxW={maxW2}
        onClick={() => {
          posthog?.capture('clicked_video');
          showVideo();
        }}
      >
        <AbsoluteCenter p={3} bg="brand.purple" cursor="pointer" rounded="full">
          <svg
            width="34"
            height="34"
            viewBox="0 0 34 34"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_78_219)">
              <path
                d="M14.1667 12.24L21.6325 17L14.1667 21.76V12.24ZM11.3334 7.08337V26.9167L26.9167 17L11.3334 7.08337Z"
                fill="white"
              />
            </g>
            <defs>
              <clipPath id="clip0_78_219">
                <rect width="34" height="34" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </AbsoluteCenter>
        <HighQualityImage
          className="h-full w-full cursor-pointer rounded-md border-2 border-[#E2E8F0] shadow-md"
          src={'/landingsponsor/displays/sponsor-dashboard.webp'}
          alt="Sponsord dashboard screenshot"
        />
      </Center>
      <Grid
        gap={{ base: 10, md: 10, xl: 20 }}
        templateColumns={{
          base: 'repeat(1, 1fr)',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
        }}
        maxW={maxW2}
        mt="4rem"
      >
        {features.map((feature, index) => (
          <Feature key={index} {...feature} />
        ))}
      </Grid>
    </VStack>
  );
}

function Feature({ icon, title, description }: FeatureProps) {
  return (
    <VStack align="start" gap={4}>
      <HighQualityImage src={icon} alt={title} className="h-[1.8rem] w-8" />
      <VStack align="start" gap={0}>
        <Text color="brand.slate.700" fontSize={'1.25rem'} fontWeight={600}>
          {title}
        </Text>
        <Text
          color="brand.slate.500"
          fontSize={'1rem'}
          fontWeight={500}
          lineHeight={1.2}
        >
          {description}
        </Text>
      </VStack>
    </VStack>
  );
}

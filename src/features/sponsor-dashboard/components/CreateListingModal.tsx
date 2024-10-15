import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React from 'react';

import { useListingFormStore } from '@/features/listing-builder';
import { BountyIcon } from '@/svg/bounty-icon';
import { ProjectIcon } from '@/svg/project-icon';

export const CreateListingModal = ({
  isOpen = false,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const posthog = usePostHog();
  const router = useRouter();
  const { resetForm } = useListingFormStore();

  const resetListingForm = () => {
    resetForm();
  };

  const handleCreateBounty = () => {
    resetListingForm();
    posthog.capture('create new bounty_sponsor');
    router.push('/dashboard/create-bounty');
  };

  const handleCreateProject = () => {
    resetListingForm();
    posthog.capture('create new project_sponsor');
    router.push('/dashboard/create-project');
  };

  return (
    <Modal isCentered isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent overflow="hidden" bg="white" borderRadius="lg">
        <ModalCloseButton color="brand.slate.300" />
        <Flex>
          <Box pos="relative" flex={1}>
            <Center pos="relative" mb={6} px={32} py={12} bg="#F5F3FF">
              <Image
                w="100%"
                h="auto"
                alt="Bounty Illustration"
                src="/assets/dashboard/bounty_illustration.svg"
              />
              <Flex
                pos="absolute"
                top={4}
                right={4}
                align="center"
                px={3}
                py={1}
                color="#8B5CF6"
                bg="white"
                borderRadius="full"
              >
                <BountyIcon
                  styles={{
                    width: '1rem',
                    height: '1rem',
                    marginRight: '0.25rem',
                    color: 'red',
                    fill: '#8B5CF6',
                  }}
                />
                <Text fontSize="sm" fontWeight="bold">
                  Bounty
                </Text>
              </Flex>
            </Center>
            <Box p={8}>
              <Heading as="h3" mb={4} fontWeight={600} size="md">
                Host a Work Competition
              </Heading>
              <Text mb={4} color="brand.slate.500">
                All participants complete your scope of work, and the best
                submission(s) are rewarded. Get multiple options to choose from.
              </Text>
              <Button w="full" py={7} onClick={handleCreateBounty} size="lg">
                Create a Bounty
              </Button>
            </Box>
          </Box>
          <Box
            pos="relative"
            flex={1}
            borderLeftWidth={'1px'}
            borderLeftColor={'brand.slate.200'}
          >
            <Center pos="relative" mb={6} px={32} py={12} bg="#EFF6FF">
              <Image
                w="100%"
                h="auto"
                alt="Project Illustration"
                src="/assets/dashboard/project_illustration.svg"
              />
              <Flex
                pos="absolute"
                top={4}
                right={4}
                align="center"
                px={3}
                py={1}
                color="#3B82F6"
                bg="white"
                borderRadius="full"
              >
                <ProjectIcon
                  styles={{
                    width: '1rem',
                    height: '1rem',
                    marginRight: '0.25rem',
                    color: 'red',
                    fill: '#3B82F6',
                  }}
                />
                <Text fontSize="sm" fontWeight="bold">
                  Project
                </Text>
              </Flex>
            </Center>
            <Box p={8}>
              <Heading as="h3" mb={4} fontWeight={600} size="md">
                Hire a Freelancer
              </Heading>
              <Text mb={4} color="brand.slate.500">
                Get applications based on a questionnaire set by you, and select
                one applicant to work with. Give a fixed budget, or ask for
                quotes.
              </Text>
              <Button w="full" py={7} onClick={handleCreateProject} size="lg">
                Create a Project
              </Button>
            </Box>
          </Box>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

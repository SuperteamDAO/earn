/* eslint-disable @next/next/no-html-link-for-pages */
import {
  Box,
  Button,
  Divider,
  Flex,
  Image,
  ListItem,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  UnorderedList,
} from '@chakra-ui/react';
import React from 'react';

import { useListingFormStore } from '@/features/listing-builder';

export const CreateListingModal = ({
  isOpen = false,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { resetForm } = useListingFormStore();
  const resetListingForm = () => {
    resetForm();
  };
  return (
    <Modal isCentered isOpen={isOpen} onClose={onClose} size={'5xl'}>
      <ModalOverlay />
      <ModalContent mb="25%">
        <ModalCloseButton color={'brand.slate.300'} />
        <Flex>
          <Flex direction={'column'} w="50%" px={6} py={4}>
            <Image
              w={14}
              h={16}
              mt={1}
              alt={'New Bounty'}
              src={'/assets/icons/bolt.svg'}
            />
            <Text
              mt={4}
              color="brand.slate.800"
              fontSize={'xl'}
              fontWeight={600}
            >
              Create a Bounty
            </Text>
            <Text mt={2} color="brand.slate.500">
              Bounties are listings where all participants do the work, and the
              best submission(s) are rewarded
            </Text>
            <Text mt={16} color="brand.slate.500" fontWeight={700}>
              Great for:
            </Text>
            <UnorderedList mt={1} mb={4} ml={6} color="brand.slate.500">
              <ListItem mb={1}>raising awareness for your product, or</ListItem>
              <ListItem mb={1}>
                when you want multiple deliverable options
              </ListItem>
              <ListItem mb={1}>
                Examples: Twitter threads, long-form articles, merch/logo
                design, product feedback, etc.
              </ListItem>
            </UnorderedList>
            <Box flex="1" />
            <a href="/dashboard/create-bounty">
              <Button w="full" onClick={resetListingForm} size="lg">
                Create New Bounty
              </Button>
            </a>
          </Flex>
          <Divider
            w="1px"
            h="lg"
            borderColor={'brand.slate.200'}
            orientation="vertical"
          />
          <Flex direction={'column'} w="50%" px={6} py={4}>
            <Image
              w={14}
              h={16}
              mt={1}
              alt={'New Project'}
              src={'/assets/icons/briefcase.svg'}
            />
            <Text
              mt={4}
              color="brand.slate.800"
              fontSize={'xl'}
              fontWeight={600}
            >
              Create a Project
            </Text>
            <Text mt={2} color="brand.slate.500">
              Solicit applications based on a custom questionnaire, and select
              one applicant to work on your listing
            </Text>
            <Text mt={16} color="brand.slate.500" fontWeight={700}>
              Great for:
            </Text>
            <UnorderedList mt={1} mb={4} ml={6} color="brand.slate.500">
              <ListItem mb={1}>the work to be done is specific, or</ListItem>
              <ListItem mb={1}>
                the output would require feedback and iteration
              </ListItem>
              <ListItem mb={1}>
                Examples: Website/app development, website/app design, producing
                hype videos, hiring a Twitter manager, etc.
              </ListItem>
            </UnorderedList>
            <Box flex="1" />
            <Divider
              w="120px"
              color="brand.slate.200"
              orientation="horizontal"
            />
            <a href="/dashboard/create-project">
              <Button w="full" onClick={resetListingForm} size="lg">
                Create New Project
              </Button>
            </a>
          </Flex>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

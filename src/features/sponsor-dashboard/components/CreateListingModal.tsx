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
import NextLink from 'next/link';
import React from 'react';

export const CreateListingModal = ({
  isOpen = false,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
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
              <ListItem>
                raising awareness for your product, specific features,
                campaigns, etc.
              </ListItem>
              <ListItem>
                or, when you want multiple deliverable options to choose from
              </ListItem>
              <ListItem>
                Examples: Twitter threads, deep dive articles, merch/logo
                design, product feedback, etc.
              </ListItem>
            </UnorderedList>
            <Box flex="1" />
            <Button as={NextLink} href="/dashboard/create-bounty" size="lg">
              Create New Bounty
            </Button>
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
              <ListItem>the work to be done is very specific, or</ListItem>
              <ListItem>it would require iteration and feedback</ListItem>
              <ListItem>
                Example: Website / app development, website / app design, hype
                video creation, hiring a Twitter manager, etc.
              </ListItem>
            </UnorderedList>
            <Box flex="1" />
            <Divider
              w="120px"
              color="brand.slate.200"
              orientation="horizontal"
            />
            <Button as={NextLink} href="/dashboard/create-project" size="lg">
              Create New Project
            </Button>
          </Flex>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

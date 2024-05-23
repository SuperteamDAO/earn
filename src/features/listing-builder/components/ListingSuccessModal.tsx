import {
  AddIcon,
  ArrowBackIcon,
  ArrowForwardIcon,
  CheckIcon,
  CopyIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  useClipboard,
  VStack,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { FaTelegramPlane } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { LuCheck } from 'react-icons/lu';

import { telegramShareLink, tweetEmbedLink } from '@/utils/socialEmbeds';
import { getURL } from '@/utils/validUrl';

interface Props {
  onClose: () => void;
  isOpen: boolean;
  slug: string;
  type: string;
}
export const ListingSuccessModal = ({ isOpen, onClose, slug, type }: Props) => {
  const listingLink = (medium?: 'twitter' | 'telegram') =>
    `${getURL()}listings/${type}/${slug}/${medium ? `?utm_source=superteamearn&utm_medium=${medium}&utm_campaign=sharelisting` : ``}`;

  const tweetShareContent = `
Check out my newly added  @superteamearn opportunity at 
${listingLink('twitter')}
`;
  const tgShareContent = `
Check out my newly added Superteam Earn opportunity 
`;
  const twitterShareLink = tweetEmbedLink(tweetShareContent);
  const tgShareLink = telegramShareLink(
    listingLink('telegram'),
    tgShareContent,
  );

  const { hasCopied, onCopy } = useClipboard(listingLink());
  const router = useRouter();

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalOverlay />
        <ModalContent overflow="hidden" h={'max'} rounded="lg">
          <VStack align="start" gap={4}>
            <Box w="full" py={20} bg="#ECFDF5">
              <Center
                w="fit-content"
                mx="auto"
                p={3}
                bg={'#10B981'}
                rounded={'full'}
              >
                <LuCheck
                  strokeWidth={3}
                  color="white"
                  style={{ width: '1.5em', height: '1.5em' }}
                />
              </Center>
            </Box>
            <VStack align="start" p={8} pt={0}>
              <Text
                color={'brand.slate.800'}
                fontFamily={'var(--font-sans)'}
                fontWeight={600}
              >
                Your Listing is Live
              </Text>
              <Text
                color={'brand.slate.500'}
                fontFamily={'var(--font-sans)'}
                fontWeight={400}
              >
                Share the love on your socials and invite Earn’s best talent!
              </Text>
              <VStack gap={4} w={'full'} mt={5}>
                <HStack gap={6} w="full">
                  <Link
                    as={NextLink}
                    w="full"
                    href={twitterShareLink}
                    target="_blank"
                  >
                    <Button
                      w="full"
                      color="brand.slate.400"
                      borderColor="brand.slate.200"
                      variant="outline"
                    >
                      <FaXTwitter style={{ width: '1.3em', height: '1.3em' }} />
                    </Button>
                  </Link>
                  <Link w="full" href={tgShareLink} target="_blank">
                    <Button
                      w="full"
                      color="brand.slate.400"
                      borderColor="brand.slate.200"
                      variant="outline"
                    >
                      <FaTelegramPlane
                        style={{ width: '1.3em', height: '1.3em' }}
                      />
                    </Button>
                  </Link>
                </HStack>
                <InputGroup borderColor="brand.slate.200">
                  <Input
                    overflow="hidden"
                    color="brand.slate.500"
                    fontSize="1rem"
                    fontWeight={400}
                    whiteSpace="nowrap"
                    textOverflow="ellipsis"
                    focusBorderColor="#CFD2D7"
                    isReadOnly
                    onClick={onCopy}
                    value={`earn.superteam.fun/${slug}`}
                  />
                  <InputRightElement h="100%" mr="1rem">
                    {hasCopied ? (
                      <CheckIcon
                        h="1.3rem"
                        w="1.3rem"
                        color="brand.slate.400"
                      />
                    ) : (
                      <CopyIcon
                        onClick={onCopy}
                        cursor="pointer"
                        h="1.3rem"
                        w="1.3rem"
                        color="brand.slate.400"
                      />
                    )}
                  </InputRightElement>
                </InputGroup>
                <Button
                  gap={2}
                  w="100%"
                  fontWeight={500}
                  onClick={() => {
                    router.push(`/listings/${type}/${slug}`);
                  }}
                  variant="solidSecondary"
                >
                  View Listing <ArrowForwardIcon />
                </Button>
                <Button
                  gap={2}
                  w="100%"
                  fontWeight={500}
                  onClick={() => {
                    router.push(
                      `/dashboard/listings/${slug}/submissions?scout`,
                    );
                  }}
                  variant="solid"
                >
                  Invite Talent <AddIcon h="0.8em" w="0.8em" />
                </Button>
                <Button
                  gap={2}
                  w="100%"
                  color="brand.slate.400"
                  fontWeight={500}
                  borderColor="brand.slate.200"
                  onClick={() => {
                    if (type === 'hackathon') {
                      router.push(`/dashboard/hackathon/`);
                    } else {
                      router.push('/dashboard/listings');
                    }
                  }}
                  variant="outline"
                >
                  <ArrowBackIcon />
                  Back to Dashboard
                </Button>
              </VStack>
            </VStack>
          </VStack>
        </ModalContent>
      </Modal>
    </>
  );
};

import {
  AddIcon,
  ArrowForwardIcon,
  CheckIcon,
  CopyIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Flex,
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
import { FaXTwitter } from 'react-icons/fa6';
import { LuCheck } from 'react-icons/lu';

import { tweetEmbedLink } from '@/utils/socialEmbeds';
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

  const tweetShareContent = `Check out my newly added @SuperteamEarn opportunity!

${listingLink('twitter')}
`;
  const twitterShareLink = tweetEmbedLink(tweetShareContent);

  const { hasCopied, onCopy } = useClipboard(listingLink());
  const router = useRouter();

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalOverlay />
        <ModalContent overflow="hidden" w="100%" h={'max'} rounded="lg">
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
            <VStack align="start" w="full" p={6} pt={0}>
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
                <Button
                  alignItems="center"
                  justifyContent="space-between"
                  gap={2}
                  w="full"
                  borderColor="brand.slate.200"
                  _hover={{ bg: 'brand.slate.100' }}
                  userSelect={'none'}
                  variant="outline"
                >
                  <Text
                    overflow="hidden"
                    color="brand.slate.500"
                    fontSize="1rem"
                    fontWeight={400}
                    whiteSpace="nowrap"
                    userSelect={'none'}
                    textOverflow="ellipsis"
                    cursor="pointer"
                    onClick={onCopy}
                  >
                    earn.superteam.fun/{slug}
                  </Text>
                  <Box mr="0rem">
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
                  </Box>
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
                <Flex
                  justify="space-between"
                  w="100%"
                  color="brand.slate.500"
                  fontSize="sm"
                  fontWeight={500}
                >
                  <Link
                    as={NextLink}
                    alignItems="center"
                    gap={1}
                    display="flex"
                    href={twitterShareLink}
                    target="_blank"
                  >
                    Share on
                    <FaXTwitter style={{ width: '1em', height: '1em' }} />
                  </Link>
                  <Link as={NextLink} href={`/listings/${type}/${slug}`}>
                    View Listing <ArrowForwardIcon />
                  </Link>
                </Flex>
              </VStack>
            </VStack>
          </VStack>
        </ModalContent>
      </Modal>
    </>
  );
};

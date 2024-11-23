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
  isVerified: boolean;
}
export const ListingSuccessModal = ({
  isOpen,
  onClose,
  slug,
  type,
  isVerified,
}: Props) => {
  const listingLink = (medium?: 'twitter' | 'telegram') =>
    `${getURL()}listings/${type}/${slug}/${medium ? `?utm_source=solarearn&utm_medium=${medium}&utm_campaign=sharelisting` : ``}`;

  const tweetShareContent = `Check out my newly added @solana_zh opportunity!

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
                color={'brand.slate.700'}
                fontFamily={'var(--font-sans)'}
                fontSize={'lg'}
                fontWeight={600}
              >
                您的任务已上线
              </Text>
              <Text
                mt={-2}
                color={'brand.slate.500'}
                fontFamily={'var(--font-sans)'}
                fontWeight={400}
              >
                {isVerified
                  ? '在社交媒体上分享喜悦，并邀请最合适的人才！'
                  : '在社交媒体上分享喜悦!'}
              </Text>
              <VStack gap={4} w={'full'} mt={3}>
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
                    {getURL()}listings/{type}/{slug}
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
                {isVerified ? (
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
                ) : (
                  <Button
                    gap={2}
                    w="100%"
                    fontWeight={500}
                    onClick={() => {
                      router.push(`/listings/${type}/${slug}`);
                    }}
                    variant="solid"
                  >
                    查看任务 <ArrowForwardIcon h="0.8em" w="0.8em" />
                  </Button>
                )}
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
                    分享到
                    <FaXTwitter style={{ width: '1em', height: '1em' }} />
                  </Link>
                  {isVerified ? (
                    <Link as={NextLink} href={`/listings/${type}/${slug}`}>
                      View Listing <ArrowForwardIcon />
                    </Link>
                  ) : (
                    <Link as={NextLink} href={`/dashboard/listings/`}>
                      Sponsor Dashboard <ArrowForwardIcon />
                    </Link>
                  )}
                </Flex>
              </VStack>
            </VStack>
          </VStack>
        </ModalContent>
      </Modal>
    </>
  );
};

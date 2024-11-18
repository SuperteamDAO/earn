import {
  CheckIcon,
  ChevronLeftIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Divider,
  Flex,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Link,
  Tag,
  Text,
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import React from 'react';
import { FaXTwitter } from 'react-icons/fa6';
import { LuPencil } from 'react-icons/lu';
import { MdInsertLink } from 'react-icons/md';
import { toast } from 'sonner';

import { tokenList } from '@/constants';
import { useListingFormStore } from '@/features/listing-builder';
import {
  formatDeadline,
  getColorStyles,
  getListingIcon,
  getListingStatus,
  isDeadlineOver,
  type Listing,
} from '@/features/listings';
import { useClipboard } from '@/hooks/use-clipboard';
import { tweetEmbedLink } from '@/utils/socialEmbeds';
import { getURL } from '@/utils/validUrl';

import { SponsorPrize } from '../SponsorPrize';

interface Props {
  bounty: Listing | undefined;
  totalSubmissions: number;
  isHackathonPage?: boolean;
}

export const SubmissionHeader = ({
  bounty,
  totalSubmissions,
  isHackathonPage = false,
}: Props) => {
  const { data: session } = useSession();
  const { resetForm } = useListingFormStore();
  const router = useRouter();

  const deadline = formatDeadline(bounty?.deadline, bounty?.type);

  const listingPath = `listings/${bounty?.type}/${bounty?.slug}`;
  const { hasCopied, onCopy } = useClipboard(`${getURL()}${listingPath}`);

  const bountyStatus = getListingStatus(bounty);

  const listingLink =
    bounty?.type === 'grant'
      ? `${getURL()}grants/${bounty.slug}/`
      : `${getURL()}listings/${bounty?.type}/${bounty?.slug}/`;

  const socialListingLink = (medium?: 'twitter' | 'telegram') =>
    `${listingLink}${medium ? `?utm_source=superteamearn&utm_medium=${medium}&utm_campaign=sharelisting/` : ``}`;

  const tweetShareContent = `Check out my newly added @SuperteamEarn opportunity!

${socialListingLink('twitter')}
`;
  const twitterShareLink = tweetEmbedLink(tweetShareContent);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.get(
        `/api/sponsor-dashboard/submission/export/`,
        {
          params: {
            listingId: bounty?.id,
          },
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      const url = data?.url || '';
      if (url) {
        window.open(url, '_blank');
        toast.success('CSV exported successfully');
      } else {
        toast.error('Export URL is empty');
      }
    },
    onError: (error) => {
      console.error('Export error:', error);
      toast.error('Failed to export CSV. Please try again.');
    },
  });

  const exportSubmissionsCsv = () => {
    exportMutation.mutate();
  };

  const pastDeadline = isDeadlineOver(bounty?.deadline);

  return (
    <>
      <Box mb={2}>
        <Breadcrumb color="brand.slate.400">
          <BreadcrumbItem>
            <Link
              as={NextLink}
              href={
                bounty?.type === 'hackathon'
                  ? `/dashboard/hackathon/`
                  : '/dashboard/listings'
              }
              passHref
            >
              <BreadcrumbLink color="brand.slate.400">
                <Flex align="center">
                  <ChevronLeftIcon mr={1} w={6} h={6} />
                  All Listings
                </Flex>
              </BreadcrumbLink>
            </Link>
          </BreadcrumbItem>

          <BreadcrumbItem>
            <Text color="brand.slate.400"> {bounty?.title}</Text>
          </BreadcrumbItem>
        </Breadcrumb>
      </Box>
      <Flex align="center" justify={'space-between'} mb={4}>
        <Flex align="center" gap={2}>
          <Image h={6} alt="" src={getListingIcon(bounty?.type!)} />
          <Text color="brand.slate.800" fontSize="xl" fontWeight="700">
            {bounty?.title}
          </Text>
        </Flex>
        <Flex align="center" gap={2}>
          <Button
            color="brand.slate.400"
            _hover={{ bg: '#E0E7FF', color: '#6366F1' }}
            isLoading={exportMutation.isPending}
            leftIcon={<DownloadIcon />}
            loadingText={'Exporting...'}
            onClick={() => exportSubmissionsCsv()}
            variant={'ghost'}
          >
            Export CSV
          </Button>
          <Button
            color={'brand.slate.400'}
            _hover={{ bg: '#E0E7FF', color: '#6366F1' }}
            leftIcon={<ExternalLinkIcon />}
            onClick={() =>
              window.open(`${router.basePath}/${listingPath}`, '_blank')
            }
            variant={'ghost'}
          >
            View Listing
          </Button>
          {!!(
            (session?.user?.role === 'GOD' && bounty?.type !== 'grant') ||
            (bounty?.isPublished && !pastDeadline && bounty.type !== 'grant')
          ) && (
            <Link
              as={NextLink}
              _hover={{ textDecoration: 'none' }}
              href={
                bounty
                  ? `/dashboard/${isHackathonPage ? 'hackathon' : 'listings'}/${bounty.slug}/edit/`
                  : ''
              }
              onClick={resetForm}
            >
              <Button
                color={'brand.slate.400'}
                _hover={{ bg: '#E0E7FF', color: '#6366F1' }}
                leftIcon={<LuPencil />}
                variant={'ghost'}
              >
                Edit
              </Button>
            </Link>
          )}
        </Flex>
      </Flex>
      <Divider />
      <Flex align="center" gap={12} mt={4} mb={8}>
        <Box>
          <Text color="brand.slate.500">Submissions</Text>
          <Text mt={3} color="brand.slate.600" fontWeight={600}>
            {totalSubmissions}
          </Text>
        </Box>
        <Box>
          <Text color="brand.slate.500">Deadline</Text>
          <Text
            mt={3}
            color="brand.slate.600"
            fontWeight={600}
            whiteSpace={'nowrap'}
          >
            {deadline}
          </Text>
        </Box>
        <Box>
          <Text color="brand.slate.500">Status</Text>
          <Tag
            mt={3}
            px={3}
            color={getColorStyles(bountyStatus).color}
            fontSize={'13px'}
            fontWeight={500}
            bg={getColorStyles(bountyStatus).bgColor}
            borderRadius={'full'}
            whiteSpace={'nowrap'}
            variant="solid"
          >
            {bountyStatus}
          </Tag>
        </Box>
        <Box>
          <Text color="brand.slate.500">Prize</Text>
          <Flex align={'center'} justify={'start'} gap={1} mt={3}>
            <Image
              w={5}
              h={5}
              alt={'green dollar'}
              rounded={'full'}
              src={
                tokenList.filter((e) => e?.tokenSymbol === bounty?.token)[0]
                  ?.icon ?? '/assets/icons/green-dollar.svg'
              }
            />
            <SponsorPrize
              compensationType={bounty?.compensationType}
              maxRewardAsk={bounty?.maxRewardAsk}
              minRewardAsk={bounty?.minRewardAsk}
              rewardAmount={bounty?.rewardAmount}
              textStyle={{
                fontWeight: 600,
                color: 'brand.slate.700',
              }}
            />
            <Text color="brand.slate.400" fontWeight={600}>
              {bounty?.token}
            </Text>
          </Flex>
        </Box>
        <Box ml="auto">
          <Text color="brand.slate.500">Share</Text>
          <Flex align="center" gap={4} mt={2}>
            <InputGroup bg="#F8FAFC" borderColor={'brand.slate.100'}>
              <InputLeftElement>
                <Icon as={MdInsertLink} color="brand.slate.400" />
              </InputLeftElement>
              <Input
                overflow="hidden"
                w={80}
                color="brand.slate.500"
                borderColor="brand.slate.100"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                focusBorderColor="#CFD2D7"
                isReadOnly
                value={`${getURL()}${listingPath}`}
              />
              <InputRightElement h="100%">
                {hasCopied ? (
                  <CheckIcon h="1rem" w="1rem" color="brand.slate.400" />
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
            <Link
              as={NextLink}
              alignItems="center"
              gap={1}
              display="flex"
              w="fit-content"
              h="fit-content"
              p={1.5}
              color="white"
              bg="brand.slate.500"
              _hover={{
                bg: 'brand.slate.400',
              }}
              href={twitterShareLink}
              rounded="full"
              target="_blank"
            >
              <FaXTwitter style={{ width: '0.9rem', height: '0.8rem' }} />
            </Link>
          </Flex>
        </Box>
      </Flex>
    </>
  );
};

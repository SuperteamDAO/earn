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
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Tag,
  Text,
  useClipboard,
} from '@chakra-ui/react';
import axios from 'axios';
import NextLink from 'next/link';
import router from 'next/router';
import React, { useState } from 'react';

import { tokenList } from '@/constants';
import { type Grant } from '@/features/grants';
import { getColorStyles, getListingStatus } from '@/features/listings';
import { getURL } from '@/utils/validUrl';

import { SponsorPrize } from '../SponsorPrize';

interface Props {
  grant: Grant | null;
  totalApplications: number;
}

export const ApplicationHeader = ({ grant, totalApplications }: Props) => {
  const [isExporting, setIsExporting] = useState(false);

  const listingPath = `grants/${grant?.slug}`;

  const { hasCopied, onCopy } = useClipboard(`${getURL()}${listingPath}`);

  const grantStatus = getListingStatus(grant, true);

  const exportSubmissionsCsv = async () => {
    setIsExporting(true);
    try {
      const exportURL = await axios.get(
        `/api/sponsor-dashboard/submission/export/`,
        {
          params: {
            listingId: grant?.id,
          },
        },
      );
      const url = exportURL?.data?.url || '';
      window.open(url, '_blank');
      setIsExporting(false);
    } catch (e) {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Box mb={2}>
        <Breadcrumb color="brand.slate.400">
          <BreadcrumbItem>
            <NextLink href={'/dashboard/listings'} passHref>
              <BreadcrumbLink color="brand.slate.400">
                <Flex align="center">
                  <ChevronLeftIcon mr={1} w={6} h={6} />
                  All Listings
                </Flex>
              </BreadcrumbLink>
            </NextLink>
          </BreadcrumbItem>

          <BreadcrumbItem>
            <Text color="brand.slate.400"> {grant?.title}</Text>
          </BreadcrumbItem>
        </Breadcrumb>
      </Box>
      <Flex align="center" justify={'space-between'} mb={4}>
        <Flex align="center" gap={2}>
          <Image h={6} alt="" src={`/assets/icons/bank.svg`} />
          <Text color="brand.slate.800" fontSize="xl" fontWeight="700">
            {grant?.title}
          </Text>
        </Flex>
        <Flex align="center" gap={2}>
          <Button
            color="brand.slate.400"
            _hover={{ bg: '#E0E7FF', color: '#6366F1' }}
            isLoading={isExporting}
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
            View Grant
          </Button>
        </Flex>
      </Flex>
      <Divider />
      <Flex align="center" gap={12} mt={4} mb={8}>
        <Box>
          <Text color="brand.slate.500">Applications</Text>
          <Text mt={3} color="brand.slate.600" fontWeight={600}>
            {totalApplications}
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
            Rolling
          </Text>
        </Box>
        <Box>
          <Text color="brand.slate.500">Status</Text>
          <Tag
            mt={3}
            px={3}
            color={getColorStyles(grantStatus).color}
            fontSize={'13px'}
            fontWeight={500}
            bg={getColorStyles(grantStatus).bgColor}
            borderRadius={'full'}
            whiteSpace={'nowrap'}
            variant="solid"
          >
            {grantStatus}
          </Tag>
        </Box>
        <Box>
          <Text color="brand.slate.500">Grant Size</Text>
          <Flex align={'center'} justify={'start'} gap={1} mt={3}>
            <Image
              w={5}
              h={5}
              alt={'green dollar'}
              rounded={'full'}
              src={
                tokenList.filter((e) => e?.tokenSymbol === grant?.token)[0]
                  ?.icon ?? '/assets/icons/green-dollar.svg'
              }
            />
            <SponsorPrize
              compensationType={'range'}
              maxRewardAsk={grant?.maxReward}
              minRewardAsk={grant?.minReward ?? 0}
              textStyle={{
                fontWeight: 600,
                color: 'brand.slate.700',
              }}
            />
            <Text color="brand.slate.400" fontWeight={600}>
              {grant?.token}
            </Text>
          </Flex>
        </Box>
        <Box>
          <Text color="brand.slate.500">Share</Text>
          <InputGroup mt={1} mb={-2}>
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
            <InputRightElement h="100%" mr="1rem">
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
        </Box>
      </Flex>
    </>
  );
};

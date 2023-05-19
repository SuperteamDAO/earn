import { ChevronLeftIcon } from '@chakra-ui/icons';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Tag,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

import LoadingSection from '@/components/shared/LoadingSection';
import type { Bounty } from '@/interface/bounty';
import Sidebar from '@/layouts/Sidebar';

interface Props {
  slug: string;
}

function BountySubmissions({ slug }: Props) {
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [isBountyLoading, setIsBountyLoading] = useState(true);

  const getBounty = async () => {
    setIsBountyLoading(true);
    try {
      const bountyDetails = await axios.get(`/api/bounties/${slug}/`);
      console.log(
        'file: [slug].tsx:22 ~ getBounty ~ bountyDetails:',
        bountyDetails
      );
      setBounty(bountyDetails.data);
      const submissionsDetails = await axios.get(`/api/submission/${slug}/`);
      console.log(
        'file: [slug].tsx:22 ~ getsubmission ~ submissionsDetails:',
        submissionsDetails
      );
      setTotalSubmissions(submissionsDetails.data.total);
      setSubmissions(submissionsDetails.data.data);
      setIsBountyLoading(false);
    } catch (e) {
      console.log(e);
      setIsBountyLoading(false);
    }
  };

  useEffect(() => {
    getBounty();
  }, []);

  const bountyStatus =
    // eslint-disable-next-line no-nested-ternary
    bounty?.status === 'OPEN'
      ? bounty?.isPublished
        ? 'PUBLISHED'
        : 'DRAFT'
      : 'CLOSED';

  const getBgColor = (status: String) => {
    switch (status) {
      case 'PUBLISHED':
        return 'green';
      case 'DRAFT':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
    <Sidebar>
      {isBountyLoading ? (
        <LoadingSection />
      ) : (
        <>
          <Box mb={4}>
            <Breadcrumb color="brand.slate.400">
              <BreadcrumbItem>
                <BreadcrumbLink
                  color="brand.slate.400"
                  href="/dashboard/bounties"
                >
                  <Flex align="center">
                    <ChevronLeftIcon mr={1} w={6} h={6} />
                    Bounties
                  </Flex>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbItem>
                <Text color="brand.slate.400">Submissions</Text>
              </BreadcrumbItem>
            </Breadcrumb>
          </Box>
          <Flex justify="space-between" mb={4}>
            <Text color="brand.slate.500" fontSize="lg" fontWeight="700">
              {bounty?.title}
            </Text>
            <Tag color={'white'} bg={getBgColor(bountyStatus)} variant="solid">
              {bountyStatus}
            </Tag>
          </Flex>
          <Flex>
            {totalSubmissions}
            {submissions?.length}
          </Flex>
        </>
      )}
    </Sidebar>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};

export default BountySubmissions;

import { HStack } from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

import ListingHeader from '@/components/listings/listings/ListingHeaderBounty';
import ErrorSection from '@/components/shared/EmptySection';
import LoadingSection from '@/components/shared/LoadingSection';
import type { Bounty } from '@/interface/bounty';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { Mixpanel } from '@/utils/mixpanel';

import type { SponsorType } from '../../../../../interface/sponsor';

interface BountyDetailsProps {
  slug: string;
}
const Sumbissions = ({ slug }: BountyDetailsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const [bounty, setBounty] = useState<Bounty | null>(null);

  const getBounty = async () => {
    setIsLoading(true);
    try {
      const bountyDetails = await axios.get(`/api/bounties/${slug}/`);
      setBounty(bountyDetails.data);

      Mixpanel.track('bounty_page_load', {
        'Bounty Title': bountyDetails.data.title,
      });
    } catch (e) {
      setError(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isLoading) return;
    getBounty();
  }, []);
  return (
    <>
      <Default
        meta={
          <Meta
            title={`${bounty?.title || 'Bounty'} | Superteam Earn`}
            description="Every Solana opportunity in one place!"
          />
        }
      >
        {isLoading && <LoadingSection />}
        {!isLoading && !!error && <ErrorSection />}
        {!isLoading && !error && !bounty?.id && (
          <ErrorSection message="Sorry! The bounty you are looking for is not available." />
        )}
        {!isLoading && !error && !!bounty?.id && (
          <>
            <ListingHeader
              id={bounty?.id}
              status={bounty?.status}
              deadline={bounty?.deadline}
              title={bounty?.title ?? ''}
              sponsor={bounty?.sponsor as SponsorType}
              poc={bounty?.poc}
              slug={bounty?.slug}
            />
            <HStack
              align={['center', 'center', 'start', 'start']}
              justify={['center', 'center', 'space-between', 'space-between']}
              flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
              gap={4}
              maxW={'7xl'}
              mb={10}
              mx={'auto'}
            >
              {/* <SubmissionPage /> */}
            </HStack>
          </>
        )}
      </Default>
    </>
  );
};

export default Sumbissions;

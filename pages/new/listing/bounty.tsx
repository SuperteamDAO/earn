import { Box } from '@chakra-ui/react';

import ErrorSection from '@/components/shared/ErrorSection';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { userStore } from '@/store/user';

function BountyListing() {
  const { userInfo } = userStore();
  return (
    <Default
      meta={
        <Meta
          title="Create Listing | Superteam Earn"
          description="Every Solana opportunity in one place!"
          canonical="/assets/logo/og.svg"
        />
      }
    >
      {!userInfo?.id || userInfo?.role !== 'GOD' ? (
        <ErrorSection
          title="Access is Forbidden!"
          message="Please contact support to access this section."
        />
      ) : (
        <Box>Hello!</Box>
      )}
    </Default>
  );
}

export default BountyListing;

import axios from 'axios';
import type { GetServerSideProps } from 'next';

import { type Listing, ReferenceCard } from '@/features/listings';
import { ListingPageLayout } from '@/layouts/Listing';
import { getURL } from '@/utils/validUrl';

interface BountyDetailsProps {
  bounty: Listing | null;
}

function BountyDetails({ bounty }: BountyDetailsProps) {
  return (
    <ListingPageLayout bounty={bounty}>
      <div>
        <div className="mb-10 mt-2 flex max-w-7xl flex-col gap-4 rounded-lg bg-white md:flex-row md:items-start md:justify-between">
          <div className="w-full">
            <p className="mb-6 mt-2 text-xl font-semibold text-gray-500">
              References
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bounty?.references?.map((reference, i) => (
                <ReferenceCard
                  title={reference.title}
                  link={reference.link}
                  key={i}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </ListingPageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, type } = context.query;

  let bountyData;
  try {
    const bountyDetails = await axios.get(
      `${getURL()}api/listings/details/${slug}`,
      {
        params: {
          type,
        },
      },
    );
    bountyData = bountyDetails.data;
  } catch (e) {
    console.error(e);
    bountyData = null;
  }

  return {
    props: {
      bounty: bountyData,
    },
  };
};

export default BountyDetails;

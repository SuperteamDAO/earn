import axios from 'axios';
import type { GetServerSideProps } from 'next';
import React, { useState } from 'react';

import { type GrantWithApplicationCount } from '@/features/grants';
import { ReferenceCard } from '@/features/listings';
import { GrantPageLayout } from '@/layouts/Grants';
import { getURL } from '@/utils/validUrl';

interface GrantsDetailsProps {
  grant: GrantWithApplicationCount | null;
}

function Grants({ grant: initialGrant }: GrantsDetailsProps) {
  const [grant] = useState<typeof initialGrant>(initialGrant);

  return (
    <GrantPageLayout grant={grant}>
      <div>
        <div className="mb-10 mt-2 flex max-w-7xl flex-col gap-4 rounded-lg bg-white md:flex-row md:items-start md:justify-between">
          <div className="w-full">
            <p className="mb-6 mt-2 text-xl font-semibold text-gray-500">
              References
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {grant?.references?.map((reference, i) => (
                <ReferenceCard link={reference.link} key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </GrantPageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  let grantData;
  try {
    const grantDetails = await axios.get(`${getURL()}api/grants/${slug}`);
    grantData = grantDetails.data;
  } catch (e) {
    console.error(e);
    grantData = null;
  }

  return {
    props: {
      grant: grantData,
    },
  };
};
export default Grants;

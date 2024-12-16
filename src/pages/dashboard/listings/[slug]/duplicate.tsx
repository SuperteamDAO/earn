import type { GetServerSideProps } from 'next';
import React from 'react';

import { ListingBuilder } from '@/features/listing-builder/components/ListingBuilder';

interface Props {
  slug: string;
}

function EditBounty({ slug }: Props) {
  return <ListingBuilder route="duplicate" slug={slug} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};

export default EditBounty;

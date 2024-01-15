import type { GetServerSideProps } from 'next';

import { Sidebar } from '@/layouts/Sidebar';

interface Props {
  slug: string;
}

function EditBounty({ slug }: Props) {
  return (
    <Sidebar>
      <div>Bounty: {slug}</div>
    </Sidebar>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};

export default EditBounty;

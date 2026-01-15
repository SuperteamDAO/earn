import type { GetServerSideProps, NextPage } from 'next';

const BountiesPage: NextPage = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: `/earn/all/?tab=bounties`,
      permanent: false,
    },
  };
};

export default BountiesPage;

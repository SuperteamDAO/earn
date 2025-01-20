import type { GetServerSideProps, NextPage } from 'next';

const Bounty: NextPage = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };

  return {
    redirect: {
      destination: `/listing/${slug}/`,
      permanent: false,
    },
  };
};

export default Bounty;

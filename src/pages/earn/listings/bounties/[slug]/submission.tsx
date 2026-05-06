import type { GetServerSideProps, NextPage } from 'next';

const Bounty: NextPage = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { res } = context;
  const { slug } = context.params as { slug: string };

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return {
    redirect: {
      destination: `/earn/listing/${slug}/submission`,
      permanent: true,
    },
  };
};

export default Bounty;

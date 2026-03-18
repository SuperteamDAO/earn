import type { GetServerSideProps } from 'next';

const Sumbissions = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { res } = context;
  const { subid } = context.query;
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return {
    redirect: {
      destination: `/earn/feed/submission/${subid}/`,
      permanent: true,
    },
  };
};

export default Sumbissions;

import type { GetServerSideProps, NextPage } from 'next';

const Grants: NextPage = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { res } = context;
  const { slug } = context.params as { slug: string };

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return {
    redirect: {
      destination: `/earn/grants/${slug}/`,
      permanent: true,
    },
  };
};

export default Grants;

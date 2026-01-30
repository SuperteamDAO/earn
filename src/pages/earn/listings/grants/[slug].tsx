import type { GetServerSideProps, NextPage } from 'next';

const Grants: NextPage = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };

  return {
    redirect: {
      destination: `/earn/grants/${slug}/`,
      permanent: true,
    },
  };
};

export default Grants;

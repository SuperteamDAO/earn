import type { GetServerSideProps } from 'next';

const Sumbissions = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { subid } = context.query;
  return {
    redirect: {
      destination: `/earn/feed/submission/${subid}/`,
      permanent: true,
    },
  };
};

export default Sumbissions;

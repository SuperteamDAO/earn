import { type GetServerSideProps } from 'next';

const SponsorListingsPage = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  if (!params || !params.slug) {
    return {
      notFound: true,
    };
  }

  return {
    redirect: {
      destination: `/${params.slug}`,
      permanent: false,
    },
  };
};

export default SponsorListingsPage;

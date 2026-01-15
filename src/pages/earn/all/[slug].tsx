import type { GetServerSideProps, NextPage } from 'next';

const CategoryPage: NextPage = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };

  return {
    redirect: {
      destination: `/category/${slug}/`,
      permanent: false,
    },
  };
};

export default CategoryPage;

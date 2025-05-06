import type { GetServerSideProps, NextPage } from 'next';

const CategoryPage: NextPage = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };
  const titleCaseSlug = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    redirect: {
      destination: `/?category=${titleCaseSlug}`,
      permanent: false,
    },
  };
};

export default CategoryPage;

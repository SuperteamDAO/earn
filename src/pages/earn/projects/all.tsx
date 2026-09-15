import type { GetServerSideProps, NextPage } from 'next';

const ProjectsPage: NextPage = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return {
    redirect: {
      destination: `/earn/all/?tab=projects`,
      permanent: true,
    },
  };
};

export default ProjectsPage;

import type { GetServerSideProps, NextPage } from 'next';

const ProjectsPage: NextPage = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: `/earn/all/?tab=projects`,
      permanent: false,
    },
  };
};

export default ProjectsPage;

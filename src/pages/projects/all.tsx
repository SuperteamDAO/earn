import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const ProjectsPage: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/all/?tab=projects');
  }, [router]);

  return null;
};

export default ProjectsPage;

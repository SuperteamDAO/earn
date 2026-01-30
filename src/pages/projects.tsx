import axios from 'axios';
import { type GetServerSideProps } from 'next';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { Meta } from '@/layouts/Meta';

import HeroContainer from '@/features/stfun/components/common/HeroContainer';
import ProjectsGrid from '@/features/stfun/components/grids/ProjectsGrid';

interface Project {
  fields: {
    Name: string;
    Tagline: string;
    'Project Link': string;
    'Project Twitter': string;
    'Logo Link': string;
    Country: string;
    Rank: number;
  };
}

interface ProjectsPageProps {
  projects: Project[];
}

export default function Projects({ projects }: ProjectsPageProps) {
  return (
    <>
      <Meta
        title="Projects | Industry Leading Builds by Superteam"
        description="Explore industry-leading projects that Superteam Members around the world have built and launched on Solana."
        canonical="https://superteam.fun/projects/"
        og={`${ASSET_URL}/st/og/og-projects.png`}
      />

      <img
        src={`${ASSET_URL}/st/images/project-bg-lg.webp`}
        srcSet={`${ASSET_URL}/st/images/project-bg-sm.webp 640w, ${ASSET_URL}/st/images/project-bg-lg.webp 1440w, ${ASSET_URL}/st/images/project-bg-xl.webp 2560w`}
        sizes="(max-width: 640px) 100vw, (max-width: 1440px) 100vw, 2560px"
        loading="eager"
        alt=""
        style={{ height: '100%' }}
        className="absolute top-0 left-0 -mt-[72px] w-full object-cover"
      />

      <section className="relative col-span-5 flex flex-col items-center pb-[300px]">
        <img
          src={`${ASSET_URL}/st/images/stars-bg.webp`}
          alt=""
          className="stars-bg"
        />
        <HeroContainer
          line1="Industry Leading"
          line2="Projects"
          line3="superteam is the forefront community for web3,"
          line4="powered by solana."
          buttonVisible={false}
        />
        <ProjectsGrid projects={projects} />
      </section>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const result = await axios(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_PROJECTS_TABLE}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
        },
      },
    );

    const filtered = result?.data?.records.filter(
      (item: any) => item.fields['Rank'] && item.fields['Country'],
    );

    return {
      props: {
        projects: filtered ?? [],
      },
    };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return {
      props: {
        projects: [],
      },
    };
  }
};

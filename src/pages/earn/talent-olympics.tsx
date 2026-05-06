import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return {
    redirect: {
      destination: '/earn/hackathon/talent-olympics',
      permanent: true,
    },
  };
};

export default function Hackathon() {
  return null;
}

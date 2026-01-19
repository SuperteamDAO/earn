import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
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

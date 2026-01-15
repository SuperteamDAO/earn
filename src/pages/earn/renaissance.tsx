import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/hackathon/renaissance',
      permanent: false,
    },
  };
};

export default function Hackathon() {
  return null;
}

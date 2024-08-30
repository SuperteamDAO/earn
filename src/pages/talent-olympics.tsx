import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/hackathon/talent-olympics',
      permanent: false,
    },
  };
};

export default function Hackathon() {
  return null;
}

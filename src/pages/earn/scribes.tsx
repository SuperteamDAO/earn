import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/earn/hackathon/scribes',
      permanent: false,
    },
  };
};

export default function Hackathon() {
  return null;
}

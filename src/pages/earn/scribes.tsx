import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/hackathon/scribes',
      permanent: false,
    },
  };
};

export default function Hackathon() {
  return null;
}

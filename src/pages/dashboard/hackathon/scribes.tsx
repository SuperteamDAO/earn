import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/dashboard/hackathon',
      permanent: false,
    },
  };
};

export default function Jobs() {
  return null;
}

import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/sponsor/pyth',
      permanent: false,
    },
  };
};

export default function Pyth() {
  return null;
}

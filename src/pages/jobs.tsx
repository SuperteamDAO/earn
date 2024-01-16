import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
    redirect: {
      destination: '/',
      permanent: false,
    },
  });

export default function Jobs() {
  return null;
}

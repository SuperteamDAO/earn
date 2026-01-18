import type { GetServerSideProps } from 'next';

export default function DashboardIndex() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/earn/dashboard/listings',
      permanent: true,
    },
  };
};

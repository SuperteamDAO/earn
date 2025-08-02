import type { GetServerSideProps } from 'next';

export default function DashboardIndex() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/dashboard/listings',
      permanent: true,
    },
  };
};

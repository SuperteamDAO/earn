import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination:
        'https://earn.superteam.fun/listings/project/head-of-operations-solana-superteam-mexico',
      permanent: false,
    },
  };
};

export default function Jobs() {
  return null;
}
